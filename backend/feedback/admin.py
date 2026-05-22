from django.contrib import admin
from .models import PlatformFeedback


@admin.register(PlatformFeedback)
class PlatformFeedbackAdmin(admin.ModelAdmin):
    list_display  = ["user", "nps_score", "accuracy_rating", "usability_rating",
                     "coverage_rating", "is_featured", "display_name", "created_at"]
    list_filter   = ["is_featured"]
    list_editable = ["is_featured", "display_name"]
    search_fields = ["user__email", "comment", "display_name"]
    ordering      = ["-created_at"]
    readonly_fields = ["created_at", "updated_at"]