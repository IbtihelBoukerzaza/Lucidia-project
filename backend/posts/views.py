from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Post
from .serializers import PostCreateSerializer, PostSerializer
from .services import company_ids_for_user


class PostListCreateView(generics.ListCreateAPIView):
    """
    List posts for companies the user belongs to.
    Optional query: ?company=<id> (must be one of those companies).

    Create: same scope; manual source gets a generated external_id if omitted.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PostCreateSerializer
        return PostSerializer

    def get_queryset(self):
        ids = company_ids_for_user(self.request.user)
        qs = Post.objects.filter(company_id__in=ids).select_related("company")
        company_param = self.request.query_params.get("company")
        if company_param is not None and company_param != "":
            try:
                cid = int(company_param)
            except (TypeError, ValueError):
                return Post.objects.none()
            if cid not in ids:
                return Post.objects.none()
            qs = qs.filter(company_id=cid)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            PostSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )
