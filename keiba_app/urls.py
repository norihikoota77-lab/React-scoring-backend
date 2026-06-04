from django.contrib import admin
from django.urls import path
from . import views

from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    # TOP                            ← views.indexを削除
    path("api/history/", views.history_api, name="history_api"),
    path(
        "api/history/delete/<int:history_id>/",
        views.delete_history_api
    ),
    path(
        "api/history/export/",
        views.export_history_csv
    ),
    # Excelダウンロード
    path(
        "reports/<str:file_name>/",
        views.download_report,
        name="download_report"
    ),
    # React API
    path(
        "api/score/",
        views.score_api,
        name="score_api"
    ),
    path(
        "api/exams/",
        views.exam_list_api,
        name="exam_list_api"
    ),
    path(
        "api/exams/<int:exam_id>/questions/",
        views.exam_questions_api,
        name="exam_questions_api"
    ),
    path(
        "api/exams/<int:exam_id>/submit/",
        views.exam_submit_api,
        name="exam_submit_api"
    ),
    # ★ReactのSPAを返す（末尾に配置）
    path("", TemplateView.as_view(template_name="index.html")),

    path("api/score/web/", views.score_web_api, name="score_web_api"),

    path("api/create-superuser/", views.create_superuser),
]


# 開発環境用
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )