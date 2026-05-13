from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from companies.models import Membership
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
                row["like_count"] += ep.like_count or 0
                row["share_count"] += ep.share_count or 0
                row["comment_count"] += ep.comment_count or 0
                row["view_count"] += ep.view_count or 0

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

        limit = min(int(request.query_params.get("limit", 10)), 50)
        platform = request.query_params.get("platform")

        qs = EngagedPost.objects.filter(company_id=company_id)
        if platform:
            qs = qs.filter(platform=platform)

        # Exclude nulls then sort descending
        qs = qs.exclude(**{f"{metric}__isnull": True}).order_by(f"-{metric}")[:limit]

        return Response(EngagedPostSerializer(qs, many=True).data)