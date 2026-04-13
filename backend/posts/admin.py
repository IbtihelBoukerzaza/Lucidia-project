from django.contrib import admin

from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "company",
        "source",
        "platform",
        "created_at",
        "external_id",
        "author",
    )
    list_filter = ("source", "platform", "company", "created_at")
    search_fields = ("text", "external_id", "author", "url")
    raw_id_fields = ("company",)
    date_hierarchy = "created_at"
