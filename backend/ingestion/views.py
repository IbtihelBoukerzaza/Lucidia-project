import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from companies.models import Membership
from .services.pipeline import run_ingestion

logger = logging.getLogger(__name__)


class TriggerIngestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):
        # RBAC check — only admins of this company may trigger ingestion
        try:
            membership = Membership.objects.get(
                user=request.user,
                company_id=company_id,
            )
        except Membership.DoesNotExist:
            return Response(
                {"detail": "أنت لست عضواً في هذه الشركة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if membership.role != "admin":
            return Response(
                {"detail": "هذه العملية متاحة للمسؤولين فقط."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            stats = run_ingestion(company_id=company_id)
        except Exception as e:
            logger.exception("Ingestion failed for company %s: %s", company_id, e)
            return Response(
                {"detail": "فشل جمع البيانات.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": "تم جمع البيانات بنجاح.",
                "stats": stats,
            },
            status=status.HTTP_200_OK,
        )