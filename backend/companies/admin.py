from django.contrib import admin

from .models import Company, Membership, CompanyKeyword


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "industry", "created_at")
    search_fields = ("name", "industry")
    list_filter = ("industry", "created_at")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "company", "role", "created_at")
    list_filter = ("role", "company")
    search_fields = ("user__email", "user__username", "company__name")
    autocomplete_fields = ("user", "company")

@admin.register(CompanyKeyword)
class CompanyKeywordAdmin(admin.ModelAdmin):
    list_display = ("id", "company", "keyword", "created_at")
    list_filter = ("company",)
    search_fields = ("keyword", "company__name")