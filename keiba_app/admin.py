from django.contrib import admin
from .models import ScoreHistory, Exam, Question


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 5
    fields = ["number", "text", "correct_answer"]
    ordering = ["number"]


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ["title", "choice_type", "question_count", "created_at"]
    list_filter = ["choice_type"]
    search_fields = ["title"]
    inlines = [QuestionInline]

    def question_count(self, obj):
        return obj.questions.count()

    question_count.short_description = "問題数"


@admin.register(ScoreHistory)
class ScoreHistoryAdmin(admin.ModelAdmin):
    list_display = ["user_name", "exam_title", "rank", "percentage", "created_at"]
    list_filter = ["rank", "exam_title"]
    search_fields = ["user_name", "exam_title"]
    readonly_fields = ["created_at"]