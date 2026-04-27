from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from companies.models import Membership
from .models import AlertRule, Alert
from .serializers import AlertRuleSerializer, AlertSerializer


def _get_company_id(request):
    """Extract and validate ?company=<id> query param."""
    company_id = request.query_params.get("company")
    if not company_id:
        return None, Response(
            {"detail": "يجب تحديد معرّف الشركة (company)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return company_id, None


def _check_membership(user, company_id):
    """Return membership or None."""
    return Membership.objects.filter(
        user=user, company_id=company_id
    ).first()


# ── Rules ──────────────────────────────────────────────────────────────────────

class AlertRuleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        rules = AlertRule.objects.filter(company_id=company_id)
        return Response(AlertRuleSerializer(rules, many=True).data)

    def post(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        serializer = AlertRuleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # Validate keyword required for keyword_spike
        rule_type = serializer.validated_data.get("rule_type")
        keyword   = serializer.validated_data.get("keyword", "").strip()
        if rule_type == "keyword_spike" and not keyword:
            return Response(
                {"keyword": ["هذا الحقل مطلوب لنوع القاعدة keyword_spike."]},
                status=400,
            )

        serializer.save(
            company_id=company_id,
            created_by=request.user,
        )
        return Response(serializer.data, status=201)


class AlertRuleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_rule(self, pk, user):
        try:
            rule = AlertRule.objects.get(pk=pk)
        except AlertRule.DoesNotExist:
            return None, Response({"detail": "القاعدة غير موجودة."}, status=404)
        if not _check_membership(user, rule.company_id):
            return None, Response({"detail": "غير مصرح."}, status=403)
        return rule, None

    def delete(self, request, pk):
        rule, err = self._get_rule(pk, request.user)
        if err:
            return err
        rule.delete()
        return Response(status=204)

    def patch(self, request, pk):
        """Toggle is_active."""
        rule, err = self._get_rule(pk, request.user)
        if err:
            return err
        rule.is_active = not rule.is_active
        rule.save(update_fields=["is_active"])
        return Response(AlertRuleSerializer(rule).data)


# ── Notifications ──────────────────────────────────────────────────────────────

class AlertListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        alerts = Alert.objects.filter(company_id=company_id).select_related("rule")[:100]
        return Response(AlertSerializer(alerts, many=True).data)


class AlertUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        count = Alert.objects.filter(
            company_id=company_id, is_read=False
        ).count()
        return Response({"count": count})


class AlertMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response({"detail": "التنبيه غير موجود."}, status=404)
        if not _check_membership(request.user, alert.company_id):
            return Response({"detail": "غير مصرح."}, status=403)
        alert.is_read = True
        alert.save(update_fields=["is_read"])
        return Response({"ok": True})


class AlertMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _check_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)
        Alert.objects.filter(company_id=company_id, is_read=False).update(is_read=True)
        return Response({"ok": True})