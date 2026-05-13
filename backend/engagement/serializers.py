from rest_framework import serializers
from .models import EngagedPost


class EngagedPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngagedPost
        fields = [
            "id",
            "url",
            "platform",
            "title",
            "like_count",
            "share_count",
            "comment_count",
            "view_count",
            "scraped_at",
        ]