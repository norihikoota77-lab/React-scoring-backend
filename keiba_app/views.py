import os
import random
import pandas as pd
import openpyxl
import tempfile
import traceback
import urllib.parse
from django.conf import settings
from django.shortcuts import render
from django.http import FileResponse, Http404
from .forms import UploadForm
from .scoring_engine import ScoringEngine
from django.http import JsonResponse #★追加
from django.views.decorators.csrf import csrf_exempt
from .models import ScoreHistory
from django.forms.models import model_to_dict
import csv
from django.http import HttpResponse
from django.utils import timezone


def index(request):
    """ファイル選択および処理のビュー"""
    form = UploadForm()
    
    if request.method == "POST":
        form = UploadForm(request.POST, request.FILES)
        
        if form.is_valid():
            correct_file = request.FILES["correct_file"]
            user_file = request.FILES["user_file"]

            # アップロードされたファイルを一時ファイルとして保持
            c_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            u_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            
            try:
                for chunk in correct_file.chunks():
                    c_temp.write(chunk)
                for chunk in user_file.chunks():
                    u_temp.write(chunk)
                
                c_temp.close()
                u_temp.close()
                
                c_path = c_temp.name
                u_path = u_temp.name

                # 正解ファイルのB13セルからタイトルを取得
                correct_title = "タイトル不明"
                try:
                    wb_c = openpyxl.load_workbook(c_path, data_only=True)
                    ws_c = wb_c.active
                    if ws_c['B13'].value:
                        correct_title = str(ws_c['B13'].value)
                except Exception as e:
                    pass

                # ユーザーファイルのB14セルから名前を取得
                user_name = "名無し"
                try:
                    wb_u = openpyxl.load_workbook(u_path, data_only=True)
                    ws_u = wb_u.active

                    print(ws_u["B14"].value)

                    if ws_u['B14'].value:
                        raw_name = str(ws_u['B14'].value)
                        user_name = "".join(c for c in raw_name if c not in r'\/:*?"<>|')
                except Exception as e:
                    pass

                # パス文字列へ変換して結合し、保存先フォルダを作成
                output_dir = os.path.join(str(settings.BASE_DIR), "reports")
                os.makedirs(output_dir, exist_ok=True)
                
                output_file = os.path.join(
                    output_dir, f"{user_name}_{os.path.splitext(user_file.name)[0]}_レース結果報告.xlsx"
                )

                engine = ScoringEngine()
                engine.grade(c_path, u_path)
                engine.export_excel(output_file)

                msg, color = engine.get_result_message()

                # スコアに応じた動画フォルダの振り分け
                if engine.percentage >= 80:
                    folder_name = "excellent"
                elif engine.percentage >= 50:
                    folder_name = "good"
                else:
                    folder_name = "try_again"

                static_videos_dir = os.path.join(str(settings.BASE_DIR), 'keiba_app', 'static', 'videos')
                folder_path = os.path.join(static_videos_dir, folder_name)
                video_file = f"videos/{folder_name}/default.mp4"

                if os.path.exists(folder_path):
                    mp4_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.mp4')]
                    if mp4_files:
                        selected_file = random.choice(mp4_files)
                        video_file = f"videos/{folder_name}/{selected_file}"

                file_name = os.path.basename(output_file)

                report_html = ""
                if os.path.exists(output_file):
                    try:
                        df = pd.read_excel(output_file)

                        # 空列名を空文字へ
                        df.columns = [
                            "" if "Unnamed" in str(col) else str(col).split(".")[0]
                            for col in df.columns
                        ]   

                        # 空セルを空文字へ
                        df = df.fillna("")
 
                        # float → int文字列化
                        df = df.map(
                            lambda x: str(int(x))
                            if isinstance(x, float) and x.is_integer()
                            else x
                        )
 
                        # HTML装飾
                        df = df.replace("⭕", '<span class="ok">⭕</span>')
                        df = df.replace("✖", '<span class="ng">✖</span>')

                        report_html = df.to_html(
                            classes='dataframe',
                            border=0,
                            index=False,
                            justify="center",
                            escape=False
                        )
                        

                        report_html = report_html.replace('✖', '<span class="text-blue-600 font-bold">✖</span>')
                    except Exception as e:
                        report_html = f"<p class='text-red-500'>プレビュー読み込みエラー: {e}</p>"

                context = {
                    "score": engine.score,
                    "valid_count": engine.valid_count,
                    "percentage": engine.percentage,
                    "rank": engine.get_rank(),
                    "msg": msg,
                    "color": color,
                    "report_file_name": file_name,
                    "report_html": report_html,
                    "video_file": video_file,
                    "user_name": user_name,
                    "correct_title": correct_title, 
                    "rows_data": engine.rows_data,
 
                        # 追加
                    "table_sets": [
                          engine.rows_data[:20],
                          engine.rows_data[20:40],
                    ],
                }

                return render(request, "result.html", context)

            except Exception as e:
                print("--- [採点処理でエラーが発生しました] ---")
                traceback.print_exc()
                return render(request, "index.html", {"form": form, "error": f"処理中にエラーが発生しました: {str(e)}"})

            finally:
                # 一時ファイルの確実に削除
                if os.path.exists(c_temp.name):
                    os.remove(c_temp.name)
                if os.path.exists(u_temp.name):
                    os.remove(u_temp.name)
        
        else:
            return render(request, "index.html", {"form": form, "error": "入力されたファイルが無効です。"})

    return render(request, "index.html", {"form": form})


def download_report(request, file_name):
    """ファイルをダウンロードさせる専用ビュー"""
    decoded_file_name = urllib.parse.unquote(file_name)
    file_path = os.path.join(str(settings.BASE_DIR), 'reports', decoded_file_name)
    
    if os.path.exists(file_path):
        response = FileResponse(open(file_path, 'rb'), as_attachment=True)
        response['Content-Disposition'] = f"attachment; filename*=UTF-8''{urllib.parse.quote(decoded_file_name)}"
        return response
    else:
        raise Http404(f"ファイルが見つかりません: {file_path}")
    

#追加
@csrf_exempt
def score_api(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "POST only"},
            status=400
        )

    try:

        correct_file = request.FILES["correct_file"]
        user_file = request.FILES["user_file"]

        c_temp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".xlsx"
        )

        u_temp = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".xlsx"
        )

        for chunk in correct_file.chunks():
            c_temp.write(chunk)

        for chunk in user_file.chunks():
            u_temp.write(chunk)

        c_temp.close()
        u_temp.close()

        engine = ScoringEngine()

        user_name = "名無し"

        exam_title = "問題"

        try:

            wb_c = openpyxl.load_workbook(
                c_temp.name,
                data_only=True
            )

            ws_c = wb_c.active

            if ws_c["B13"].value:

                exam_title = str(
                    ws_c["B13"].value
                )

        except:
            pass


        try:

            wb_u = openpyxl.load_workbook(
                u_temp.name,
                data_only=True
            )

            ws_u = wb_u.active

            if ws_u["B14"].value:

                user_name = str(
                    ws_u["B14"].value
                )

        except:
            pass

        engine.grade(
            c_temp.name,
            u_temp.name
        )

        msg, color = engine.get_result_message()

        ScoreHistory.objects.create(
            score=engine.score,
            valid_count=engine.valid_count,
            percentage=engine.percentage,
            rank=engine.get_rank(),
            message=msg,
            rows_data=engine.rows_data,
            user_name=user_name,
            exam_title=exam_title,
        ) 

        # スコアに応じた動画フォルダ
        if engine.percentage >= 80:
            folder_name = "excellent"
        elif engine.percentage >= 50:
            folder_name = "good"
        else:
            folder_name = "try_again"

        static_videos_dir = os.path.join(
            str(settings.BASE_DIR),
            "keiba_app",
            "static",
            "videos"
        )

        folder_path = os.path.join(
            static_videos_dir,
            folder_name
        )

        video_file = f"videos/{folder_name}/default.mp4"

        if os.path.exists(folder_path):

            mp4_files = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith(".mp4")
            ]

            if mp4_files:

                selected_file = random.choice(mp4_files)

                video_file = (
                    f"videos/{folder_name}/{selected_file}"
                )

        return JsonResponse({

            "score": engine.score,
            "valid_count": engine.valid_count,
            "percentage": engine.percentage,
            "rank": engine.get_rank(),
            "msg": msg,
            "rows_data": engine.rows_data,
            "video_file": video_file,       
            "user_name": user_name,
            "exam_title": exam_title,

        })

    except Exception as e:

        return JsonResponse(
            {"error": str(e)},
            status=500
        )

    finally:

        if os.path.exists(c_temp.name):
            os.remove(c_temp.name)

        if os.path.exists(u_temp.name):
            os.remove(u_temp.name)

@csrf_exempt
def history_api(request):

    histories = ScoreHistory.objects.order_by(
        "-created_at"
    )[:20]

    data = []

    for history in histories:

        data.append({
            "id": history.id,
            "score": history.score,
            "valid_count": history.valid_count,
            "percentage": history.percentage,
            "rank": history.rank,
            "message": history.message,
            "rows_data": history.rows_data,
            "created_at": history.created_at.strftime("%Y-%m-%d %H:%M"),
            "user_name": history.user_name,
            "exam_title": history.exam_title,
            "created_at": timezone.localtime(
                history.created_at
            ).strftime("%Y-%m-%d %H:%M"),

        })

    return JsonResponse(data, safe=False)


@csrf_exempt
def delete_history_api(request, history_id):

    if request.method != "DELETE":

        return JsonResponse(
            {"error": "DELETE only"},
            status=400
        )

    try:

        history = ScoreHistory.objects.get(
            id=history_id
        )

        history.delete()

        return JsonResponse({

            "message": "deleted"

        })

    except ScoreHistory.DoesNotExist:

        return JsonResponse(
            {"error": "not found"},
            status=404
        )


def export_history_csv(request):

    histories = ScoreHistory.objects.all().order_by(
        "-created_at"
    )

    response = HttpResponse(
        content_type="text/csv; charset=utf-8-sig"
    )

    response.write('\ufeff')

    response[
        "Content-Disposition"
    ] = 'attachment; filename="score_history.csv"'

    writer = csv.writer(response)

    writer.writerow([
        "日時",
        "スコア",
        "正答率",
        "ランク",
        "メッセージ",
    ])

    for history in histories:

        writer.writerow([

            timezone.localtime(
                history.created_at
            ).strftime("%Y-%m-%d %H:%M:%S"),

            history.score,

            history.percentage,

            history.rank,

            history.message,

        ])

    return response

# ================================================
#  Web採点 API
# ================================================

from .models import Exam, Question


@csrf_exempt
def exam_list_api(request):
    """試験一覧を返す"""

    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=400)

    exams = Exam.objects.all().order_by("title")

    data = [
        {
            "id": exam.id,
            "title": exam.title,
            "choice_type": exam.choice_type,
            "question_count": exam.questions.count(),
        }
        for exam in exams
    ]

    return JsonResponse(data, safe=False)


@csrf_exempt
def exam_questions_api(request, exam_id):
    """指定試験の問題一覧を返す"""

    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=400)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return JsonResponse({"error": "試験が見つかりません"}, status=404)

    questions = exam.questions.all()

    data = {
        "exam_id": exam.id,
        "exam_title": exam.title,
        "choice_type": exam.choice_type,
        "questions": [
            {
                "number": q.number,
                "text": q.text,
            }
            for q in questions
        ],
    }

    return JsonResponse(data)


@csrf_exempt
def exam_submit_api(request, exam_id):
    """解答を受け取って採点し結果を返す"""

    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=400)

    try:
        exam = Exam.objects.get(id=exam_id)
    except Exam.DoesNotExist:
        return JsonResponse({"error": "試験が見つかりません"}, status=404)

    try:
        import json
        body = json.loads(request.body)
        user_name = body.get("user_name", "名無し")
        answers = body.get("answers", {})
        # answers = {"1": "3", "2": "A", ...} 問題番号: 解答

        questions = exam.questions.all()

        rows_data = []
        score = 0
        valid_count = 0

        for q in questions:
            user_ans = str(answers.get(str(q.number), "")).strip().upper()
            correct_ans = str(q.correct_answer).strip().upper()

            is_correct = user_ans == correct_ans
            valid_count += 1

            if is_correct:
                score += 1

            rows_data.append([
                q.number,
                user_ans if user_ans else "未記入",
                correct_ans,
                "⭕" if is_correct else "✖",
            ])

        percentage = (score / valid_count * 100) if valid_count > 0 else 0.0

        # ランク判定
        if percentage == 100:
            rank = "S"
        elif percentage >= 70:
            rank = "A"
        elif percentage >= 50:
            rank = "B"
        else:
            rank = "C"

        RESULT_MESSAGES = {
            "S": "🌟🏆 [G1制覇] 伝説の三冠馬級！",
            "A": "🥈 [重賞入着] 素晴らしい末脚です",
            "B": "🐎 [入賞] 掲示板に載りました",
            "C": "🏃 [未勝利] ゲート練習からやり直し",
        }

        msg = RESULT_MESSAGES[rank]

        # 動画選択
        if percentage >= 80:
            folder_name = "excellent"
        elif percentage >= 50:
            folder_name = "good"
        else:
            folder_name = "try_again"

        static_videos_dir = os.path.join(
            str(settings.BASE_DIR),
            "keiba_app",
            "static",
            "videos"
        )

        folder_path = os.path.join(static_videos_dir, folder_name)
        video_file = f"videos/{folder_name}/default.mp4"

        if os.path.exists(folder_path):
            mp4_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".mp4")]
            if mp4_files:
                video_file = f"videos/{folder_name}/{random.choice(mp4_files)}"

        # 履歴保存
        ScoreHistory.objects.create(
            score=score,
            valid_count=valid_count,
            percentage=percentage,
            rank=rank,
            message=msg,
            rows_data=rows_data,
            user_name=user_name,
            exam_title=exam.title,
        )

        return JsonResponse({
            "score": score,
            "valid_count": valid_count,
            "percentage": percentage,
            "rank": rank,
            "msg": msg,
            "rows_data": rows_data,
            "video_file": video_file,
            "user_name": user_name,
            "exam_title": exam.title,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)