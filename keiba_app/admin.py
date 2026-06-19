from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.contrib import messages
import csv
import io
from .models import ScoreHistory, Exam, Question, Category


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 5
    fields = ["number", "text", "correct_answer", "category"]
    ordering = ["number"]


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ["title", 
                    # "short_title",
                    "choice_type", "question_count", "created_at"]
    list_filter = ["choice_type"]
    search_fields = ["title"]
    inlines = [QuestionInline]
    fields = ["title",
            #   "short_title", 
              "memo", "choice_type", "show_questions"]

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = "問題数"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:exam_id>/import-csv/",
                self.admin_site.admin_view(self.import_csv_view),
                name="exam_import_csv",
            ),
        ]
        return custom_urls + urls

    def import_csv_view(self, request, exam_id):
        exam = Exam.objects.get(id=exam_id)

        if request.method == "POST":
            csv_file = request.FILES.get("csv_file")

            if not csv_file:
                messages.error(request, "CSVファイルを選択してください")
                return redirect(f"/admin/keiba_app/exam/{exam_id}/import-csv/")

            try:
                decoded = csv_file.read().decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(decoded))
                count = 0

                for row in reader:
                    number = int(row["number"])
                    text = row.get("text", "").replace("\\n", "\n")
                    correct_answer = row["correct_answer"].strip().upper()

                    Question.objects.update_or_create(
                        exam=exam,
                        number=number,
                        defaults={
                            "text": text,
                            "correct_answer": correct_answer,
                        }
                    )
                    count += 1

                messages.success(request, f"{count}問を登録しました！")
                return redirect(f"/admin/keiba_app/exam/{exam_id}/change/")

            except Exception as e:
                messages.error(request, f"エラーが発生しました：{e}")
                return redirect(f"/admin/keiba_app/exam/{exam_id}/import-csv/")

        context = {
            "exam": exam,
            "opts": self.model._meta,
            "title": f"CSVインポート：{exam.title}",
        }
        return TemplateResponse(
            request,
            "admin/keiba_app/exam/import_csv.html",
            context
        )

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        extra_context["import_csv_url"] = f"/admin/keiba_app/exam/{object_id}/import-csv/"
        return super().change_view(request, object_id, form_url, extra_context)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):

    list_display = ["name", "created_at"]

    search_fields = ["name"]


@admin.register(ScoreHistory)
class ScoreHistoryAdmin(admin.ModelAdmin):
    list_display = ["user_name", "exam_title", "rank", "percentage", "created_at"]
    list_filter = ["rank", "exam_title"]
    search_fields = ["user_name", "exam_title"]
    readonly_fields = ["created_at"]                