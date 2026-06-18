from django.db import models


class ScoreHistory(models.Model):

    created_at = models.DateTimeField(auto_now_add=True)

    score = models.IntegerField()

    valid_count = models.IntegerField()

    percentage = models.FloatField()

    rank = models.CharField(max_length=10)

    message = models.TextField()

    rows_data = models.JSONField(default=list)

    user_name = models.CharField(
        max_length=100,
        default=""
    )

    exam_title = models.CharField(
        max_length=200,
        default=""
    )

    def __str__(self):
        return f"{self.rank} - {self.percentage}%"


class Exam(models.Model):

    CHOICE_TYPE_CHOICES = [
        ("numeric", "1〜5"),
        ("alpha", "A〜E"),
    ]

    title = models.CharField(
        max_length=200,
        verbose_name="試験名"
    )

    choice_type = models.CharField(
        max_length=10,
        choices=CHOICE_TYPE_CHOICES,
        default="numeric",
        verbose_name="選択肢タイプ"
    )

    show_questions = models.BooleanField(default=True, verbose_name="問題文を表示する")  # ★追加

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title



    class Meta:
        verbose_name = "試験"
        verbose_name_plural = "試験一覧"


class Question(models.Model):

    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="試験"
    )

    number = models.PositiveIntegerField(
        verbose_name="問題番号"
    )

    text = models.TextField(
        verbose_name="問題文"
    )

    correct_answer = models.CharField(
        max_length=10,
        verbose_name="正解"
    )

    def __str__(self):
        return f"{self.exam.title} - 問{self.number}"

    class Meta:
        verbose_name = "問題"
        verbose_name_plural = "問題一覧"
        ordering = ["number"]