from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from companies.models import Membership, CompanySocialProfile
from posts.models import Post
from .models import EngagedPost
from .serializers import EngagedPostSerializer


def _get_company_id(request):
    company_id = request.query_params.get("company")
    if not company_id:
        return None, Response(
            {"detail": "يجب تحديد معرّف الشركة (company)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return company_id, None


def _check_membership(user, company_id):
    return Membership.objects.filter(
        user=user, company_id=company_id
    ).first()


def _check_admin(user, company_id):
    return Membership.objects.filter(
        user=user, company_id=company_id, role=Membership.Role.ADMIN
    ).first()


class EngagementListView(APIView):
    """
    GET /api/engagement/?company=<id>&platform=<p>&page=<n>
    Paginated list of engaged posts, newest first.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        qs = EngagedPost.objects.filter(company_id=company_id)

        platform = request.query_params.get("platform")
        if platform:
            qs = qs.filter(platform=platform)

        page = max(1, int(request.query_params.get("page", 1)))
        page_size = 20
        total = qs.count()
        start = (page - 1) * page_size
        results = qs[start:start + page_size]

        return Response({
            "count": total,
            "page": page,
            "num_pages": max(1, (total + page_size - 1) // page_size),
            "results": EngagedPostSerializer(results, many=True).data,
        })


class EngagementStatsView(APIView):
    """
    GET /api/engagement/stats/?company=<id>
    Totals per platform + grand totals.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        qs = EngagedPost.objects.filter(company_id=company_id)

        platforms = ["facebook", "instagram", "tiktok", "youtube"]
        breakdown = {}
        totals = {
            "like_count": 0,
            "share_count": 0,
            "comment_count": 0,
            "view_count": 0,
            "post_count": 0,
        }

        for platform in platforms:
            pqs = qs.filter(platform=platform)
            row = {
                "post_count": pqs.count(),
                "like_count": 0,
                "share_count": 0,
                "comment_count": 0,
                "view_count": 0,
            }
            for ep in pqs:
                row["like_count"]    += ep.like_count or 0
                row["share_count"]   += ep.share_count or 0
                row["comment_count"] += ep.comment_count or 0
                row["view_count"]    += ep.view_count or 0

            breakdown[platform] = row
            for key in ["like_count", "share_count", "comment_count",
                        "view_count", "post_count"]:
                totals[key] += row[key]

        return Response({
            "totals": totals,
            "breakdown": breakdown,
        })


class EngagementTopView(APIView):
    """
    GET /api/engagement/top/?company=<id>&metric=like_count&limit=10&platform=<p>
    Returns top posts sorted by the requested metric.
    """
    permission_classes = [IsAuthenticated]

    ALLOWED_METRICS = {"like_count", "share_count", "comment_count", "view_count"}

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        metric = request.query_params.get("metric", "like_count")
        if metric not in self.ALLOWED_METRICS:
            return Response(
                {"detail": f"metric must be one of {self.ALLOWED_METRICS}"},
                status=400,
            )

        limit    = min(int(request.query_params.get("limit", 10)), 50)
        platform = request.query_params.get("platform")

        qs = EngagedPost.objects.filter(company_id=company_id)
        if platform:
            qs = qs.filter(platform=platform)

        qs = qs.exclude(**{f"{metric}__isnull": True}).order_by(f"-{metric}")[:limit]

        return Response(EngagedPostSerializer(qs, many=True).data)


class EngagementScrapeView(APIView):
    """
    POST /api/engagement/scrape/?company=<id>
    Admin only.

    Facebook & Instagram: reads distinct post URLs from the Post model
    (source=facebook / source=instagram) and scrapes each individually.

    TikTok & YouTube: reads profile/channel URLs from CompanySocialProfile
    and returns a list of videos per profile.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err

        if not _check_admin(request.user, company_id):
            return Response(
                {"detail": "هذه العملية متاحة للمسؤولين فقط."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.conf import settings as django_settings
        from pathlib import Path

        from .scrapers.facebook_engagement  import scrape_facebook_engagement
        from .scrapers.instagram_engagement import scrape_instagram_engagement
        from .scrapers.tiktok_engagement    import scrape_tiktok_engagement
        from .scrapers.youtube_engagement   import scrape_youtube_engagement

        backend_dir         = Path(django_settings.BASE_DIR)
        fb_session_path     = str(backend_dir / "fb_session.json")
        tiktok_cookies_path = str(backend_dir / "tiktok_cookies.json")
        youtube_api_key     = django_settings.YOUTUBE_API_KEY

        summary = {
            "scraped": {},
            "errors":  [],
        }

        # ── Facebook — post URLs from Post model ──────────────────────────
        fb_urls = (
            Post.objects
            .filter(company_id=company_id, source=Post.Source.FACEBOOK)
            .exclude(url__isnull=True)
            .exclude(url="")
            .values_list("url", flat=True)
            .distinct()
        )

        for url in fb_urls:
            try:
                data = scrape_facebook_engagement(url, fb_session_path)
                EngagedPost.objects.update_or_create(
                    company_id=company_id,
                    url=url,
                    defaults={
                        "platform":      "facebook",
                        "title":         data.get("title", ""),
                        "like_count":    data.get("like_count"),
                        "comment_count": data.get("comment_count"),
                        "share_count":   data.get("share_count"),
                        "view_count":    data.get("view_count"),
                    },
                )
                summary["scraped"]["facebook"] = summary["scraped"].get("facebook", 0) + 1
            except Exception as exc:
                summary["errors"].append({
                    "platform": "facebook",
                    "url":      url,
                    "error":    str(exc),
                })

        # ── Instagram — post URLs from Post model ─────────────────────────
        ig_urls = (
            Post.objects
            .filter(company_id=company_id, source=Post.Source.INSTAGRAM)
            .exclude(url__isnull=True)
            .exclude(url="")
            .values_list("url", flat=True)
            .distinct()
        )

        for url in ig_urls:
            try:
                data = scrape_instagram_engagement(url)
                EngagedPost.objects.update_or_create(
                    company_id=company_id,
                    url=url,
                    defaults={
                        "platform":      "instagram",
                        "title":         data.get("title", ""),
                        "like_count":    data.get("like_count"),
                        "comment_count": data.get("comment_count"),
                        "share_count":   data.get("share_count"),
                        "view_count":    data.get("view_count"),
                    },
                )
                summary["scraped"]["instagram"] = summary["scraped"].get("instagram", 0) + 1
            except Exception as exc:
                summary["errors"].append({
                    "platform": "instagram",
                    "url":      url,
                    "error":    str(exc),
                })

        # ── TikTok — profile URL from CompanySocialProfile ────────────────
        tiktok_profiles = CompanySocialProfile.objects.filter(
            company_id=company_id,
            is_active=True,
            platform="tiktok",
        )

        for profile in tiktok_profiles:
            try:
                results = scrape_tiktok_engagement(profile.url, tiktok_cookies_path)
                count = 0
                for item in results:
                    video_url = item.get("url")
                    if not video_url:
                        continue
                    EngagedPost.objects.update_or_create(
                        company_id=company_id,
                        url=video_url,
                        defaults={
                            "platform":      "tiktok",
                            "title":         item.get("title", ""),
                            "like_count":    item.get("like_count"),
                            "comment_count": item.get("comment_count"),
                            "share_count":   item.get("share_count"),
                            "view_count":    item.get("view_count"),
                        },
                    )
                    count += 1
                summary["scraped"]["tiktok"] = summary["scraped"].get("tiktok", 0) + count
            except Exception as exc:
                summary["errors"].append({
                    "platform": "tiktok",
                    "url":      profile.url,
                    "error":    str(exc),
                })

        # ── YouTube — channel URL from CompanySocialProfile ───────────────
        youtube_profiles = CompanySocialProfile.objects.filter(
            company_id=company_id,
            is_active=True,
            platform="youtube_channel",
        )

        for profile in youtube_profiles:
            try:
                results = scrape_youtube_engagement(profile.url, youtube_api_key)
                count = 0
                for item in results:
                    video_url = item.get("url")
                    if not video_url:
                        continue
                    EngagedPost.objects.update_or_create(
                        company_id=company_id,
                        url=video_url,
                        defaults={
                            "platform":      "youtube",
                            "title":         item.get("title", ""),
                            "like_count":    item.get("like_count"),
                            "comment_count": item.get("comment_count"),
                            "view_count":    item.get("view_count"),
                            "share_count":   None,
                        },
                    )
                    count += 1
                summary["scraped"]["youtube"] = summary["scraped"].get("youtube", 0) + count
            except Exception as exc:
                summary["errors"].append({
                    "platform": "youtube",
                    "url":      profile.url,
                    "error":    str(exc),
                })

        return Response(
            {
                "detail": "اكتملت عملية جمع بيانات التفاعل.",
                "summary": summary,
            },
            status=status.HTTP_200_OK,
        )