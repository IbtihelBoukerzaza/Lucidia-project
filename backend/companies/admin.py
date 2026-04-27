from django.contrib import admin

from .models import Company, Membership, CompanyKeyword, CompanySocialProfile


class CompanyKeywordInline(admin.TabularInline):
    model = CompanyKeyword
    extra = 1
    fields = ("keyword",)


class CompanySocialProfileInline(admin.TabularInline):
    model = CompanySocialProfile
    extra = 1
    fields = ("platform", "url", "is_active")


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "industry", "created_at")
    search_fields = ("name", "industry")
    list_filter = ("industry", "created_at")
    inlines = [CompanyKeywordInline, CompanySocialProfileInline]


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


@admin.register(CompanySocialProfile)
class CompanySocialProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "company", "platform", "url", "is_active", "created_at")
    list_filter = ("company", "platform", "is_active")
    search_fields = ("url", "company__name")