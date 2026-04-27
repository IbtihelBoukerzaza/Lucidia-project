from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .models import Post
from .serializers import PostCreateSerializer, PostSerializer
from .services import company_ids_for_user, user_is_admin_of_company


class PostPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        ids = company_ids_for_user(self.request.user)
        qs = Post.objects.filter(company_id__in=ids).select_related("company")

        # Filter by company
        company_param = self.request.query_params.get("company")
        if company_param:
            try:
                cid = int(company_param)
            except (TypeError, ValueError):
                return Post.objects.none()
            if cid not in ids:
                return Post.objects.none()
            qs = qs.filter(company_id=cid)

        # Filter by source (e.g. ?source=facebook)
        source_param = self.request.query_params.get("source")
        if source_param:
            qs = qs.filter(source=source_param)

        # Filter by platform (e.g. ?platform=social)
        platform_param = self.request.query_params.get("platform")
        if platform_param:
            qs = qs.filter(platform=platform_param)

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.validated_data["company"]
        if not user_is_admin_of_company(request.user, company.id):
            raise PermissionDenied("Only company admins can create posts manually.")
        instance = serializer.save()
        return Response(
            PostSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )