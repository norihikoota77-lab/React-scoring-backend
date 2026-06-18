import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const API_BASE = "https://react-scoring-backend.onrender.com";

const NUMERIC_CHOICES = ["1", "2", "3", "4", "5"];
const ALPHA_CHOICES = ["A", "B", "C", "D", "E"];

export default function WebExamCard({
  setResult,
  fetchHistories,
  users = [],
  exams: examOptions = [],
}) {
  const [step, setStep] = useState("setup");
  const [questionTexts, setQuestionTexts] = useState({});
  const [userName, setUserName] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(40);
  const [choiceType, setChoiceType] = useState("numeric");
  const [answers, setAnswers] = useState({});
  const [correctFile, setCorrectFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [masterMode, setMasterMode] = useState("upload"); // "upload" or "db"
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [showQuestions, setShowQuestions] = useState(true);
  const [sampleSize, setSampleSize] = useState(""); // 出題数（空欄=全問）
  const [questionNumbers, setQuestionNumbers] = useState([]); // 出題された問題番号
  const correctInputRef = useRef(null);

  const choices = choiceType === "numeric" ? NUMERIC_CHOICES : ALPHA_CHOICES;

  // 登録済み試験一覧を取得
  useEffect(() => {
    fetch(`${API_BASE}/api/exams/`)
      .then((res) => res.json())
      .then((data) => setExams(data))
      .catch((err) => console.error(err));
  }, []);

  // 試験選択時に選択肢タイプと試験名を自動設定

  const handleExamSelect = (examId) => {
    setSelectedExamId(examId);
    const exam = exams.find((e) => String(e.id) === String(examId));
    if (exam) {
      setExamTitle(exam.title);
      setChoiceType(exam.choice_type === "alpha" ? "alpha" : "numeric");
    }
  };


  const handleSetup = async () => {
    if (!userName.trim()) { alert("受験者名を入力してください"); return; }
    if (!examTitle.trim()) { alert("試験名を入力してください"); return; }
    if (masterMode === "db" && !selectedExamId) { alert("試験を選択してください"); return; }

    if (masterMode === "db") {
      let url = `${API_BASE}/api/exams/${selectedExamId}/questions/`;
      if (sampleSize) url += `?sample_size=${sampleSize}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const numbers = data.questions.map((q) => q.number);
        const texts = {};
        data.questions.forEach((q) => { texts[q.number] = q.text; });

        setQuestionNumbers(numbers);
        setQuestionTexts(texts);
        setQuestionCount(numbers.length);
      } catch (err) {
        alert("問題の取得に失敗しました");
        return;
      }
    } else {
      if (questionCount < 1 || questionCount > 200) { alert("問題数は1〜200の範囲で入力してください"); return; }
      setQuestionNumbers(Array.from({ length: questionCount }, (_, i) => i + 1));
      setQuestionTexts({});
    }

    setAnswers({});
    setStep("answering");
  };

  const handleAnswer = (qNum, choice) => {
    setAnswers((prev) => ({ ...prev, [qNum]: choice }));
  };


  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questionNumbers.length;

  const handleSubmit = async () => {
    if (masterMode === "upload" && !correctFile) {
      alert("正解マスタExcelを選択してください");
      return;
    }

    try {
      setLoading(true);
      let response;

      if (masterMode === "upload") {
        // Excelアップロードモード
        const formData = new FormData();
        formData.append("correct_file", correctFile);
        formData.append("user_name", userName);
        formData.append("exam_title", examTitle);
        formData.append("answers", JSON.stringify(answers));
        formData.append("question_count", questionCount);
        response = await fetch(`${API_BASE}/api/score/web/`, {
          method: "POST",
          body: formData,
        });
      } else {
        // DB登録済みマスタモード
        response = await fetch(
          `${API_BASE}/api/exams/${selectedExamId}/submit/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_name: userName,
              answers: answers,
              question_numbers: questionNumbers,
            }),
          },
        );
      }

      const text = await response.text();
      const data = JSON.parse(text);
      if (data.error) {
        alert(data.error);
        return;
      }
      setResult(data);
      await fetchHistories();
      setStep("setup");
      setAnswers({});
      setCorrectFile(null);
    } catch (error) {
      console.error(error);
      alert("通信エラー");
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionCard = (qNum) => {
    const question = questionTexts[qNum];
    return (
      <div
        key={qNum}
        className={`border rounded-2xl p-4 transition ${
          answers[qNum]
            ? "border-green-400/50 bg-green-500/10"
            : "border-white/20 bg-white/5"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-slate-300">問題 {qNum}</span>
          {answers[qNum] && (
            <span className="text-green-400 font-bold text-sm">
              ✓ {answers[qNum]}
            </span>
          )}
        </div>

        {/* 問題文（showQuestionsがtrueの時のみ表示） */}
        {showQuestions && question && (
          <div className="mb-3 text-sm text-slate-200 prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-slate-700 px-1 rounded text-red-300"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {question}
            </ReactMarkdown>
          </div>
        )}

        <div className="flex gap-2">
          {choices.map((choice) => (
            <button
              key={choice}
              onClick={() => handleAnswer(qNum, choice)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${
                answers[qNum] === choice
                  ? "bg-red-500 text-white scale-105"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================
  // STEP 1：セットアップ画面
  // ============================================================
  if (step === "setup") {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10">
        <h2 className="text-3xl font-extrabold mb-8 text-center">🌐 Web解答</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 受験者名 */}
          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">
              受験者名
            </label>
            <input
              type="text"
              list="user-list"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="例：坂井"
              className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white"
            />
            <datalist id="exam-list">
              {examOptions.map((exam) => (
                <option key={exam} value={exam} />
              ))}
            </datalist>
          </div>

          {/* 正解マスタモード切り替え */}
          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">
              正解マスタ
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMasterMode("upload")}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  masterMode === "upload"
                    ? "bg-red-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                📁 毎回アップロード
              </button>
              <button
                onClick={() => setMasterMode("db")}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  masterMode === "db"
                    ? "bg-red-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🗄️ 登録済みを使う
              </button>
            </div>
          </div>
        </div>


        {/* 登録済みマスタモード */}
        {masterMode === "db" && (
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* 試験を選択（3列分使う） */}
            <div className="md:col-span-3">
              <label className="text-slate-300 text-sm font-bold mb-2 block">試験を選択</label>
              <select
                value={selectedExamId}
                onChange={(e) => handleExamSelect(e.target.value)}
                className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white"
              >
                <option value="">-- 試験を選択してください --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}（{exam.question_count}問・{exam.choice_type === "alpha" ? "A〜E" : "1〜5"}）
                  </option>
                ))}
              </select>
            </div>

            {/* 問題文の表示 */}
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">問題文の表示</label>
              <div className="flex gap-3">
                <button onClick={() => setShowQuestions(true)} className={`flex-1 py-3 rounded-xl font-bold transition ${showQuestions ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>📖 表示</button>
                <button onClick={() => setShowQuestions(false)} className={`flex-1 py-3 rounded-xl font-bold transition ${!showQuestions ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>🔢 のみ</button>
              </div>
            </div>

            {/* 選択肢タイプ */}
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">選択肢タイプ</label>
              <div className="flex gap-3">
                <button onClick={() => setChoiceType("numeric")} className={`flex-1 py-3 rounded-xl font-bold transition ${choiceType === "numeric" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>1〜5</button>
                <button onClick={() => setChoiceType("alpha")} className={`flex-1 py-3 rounded-xl font-bold transition ${choiceType === "alpha" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>A〜E</button>
              </div>
            </div>

            {/* 出題数 */}
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">出題数（空欄で全問）</label>
              <input
                type="number"
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                min="1"
                placeholder="例：10"
                className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white"
              />
            </div>
          </div>
        )}


        {/* アップロードモード */}
        {masterMode === "upload" && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">試験名</label>
              <input type="text" list="exam-list" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="例：python模擬試験" className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white" />
              <datalist id="exam-list">
                {exams.map((exam) => (<option key={exam.id} value={exam.title} />))}
              </datalist>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">問題数</label>
              <input type="number" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} min="1" max="200" className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">問題文の表示</label>
              <div className="flex gap-3">
                <button onClick={() => setShowQuestions(true)} className={`flex-1 py-3 rounded-xl font-bold transition ${showQuestions ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>📖 表示する</button>
                <button onClick={() => setShowQuestions(false)} className={`flex-1 py-3 rounded-xl font-bold transition ${!showQuestions ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>🔢 解答のみ</button>
              </div>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-bold mb-2 block">選択肢タイプ</label>
              <div className="flex gap-3">
                <button onClick={() => setChoiceType("numeric")} className={`flex-1 py-3 rounded-xl font-bold transition ${choiceType === "numeric" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>1〜5</button>
                <button onClick={() => setChoiceType("alpha")} className={`flex-1 py-3 rounded-xl font-bold transition ${choiceType === "alpha" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>A〜E</button>
              </div>
            </div>
          </div>
        )}


        <button
          onClick={handleSetup}
          className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition duration-300 text-white font-bold py-4 rounded-2xl shadow-2xl text-lg"
        >
          解答をはじめる
        </button>

        {/* 管理画面リンク */}
        {masterMode === "db" && (
          <div className="mt-4 text-center">
            <a
              href="https://react-scoring-backend.onrender.com/admin/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 text-sm hover:text-slate-300 transition underline"
            >
              ⚙️ 試験・問題を追加・編集する場合はこちら
            </a>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // STEP 2：解答画面
  // ============================================================
  if (step === "answering") {
    const half = Math.ceil(questionNumbers.length / 2);
    const leftQuestions = questionNumbers.slice(0, half);
    const rightQuestions = questionNumbers.slice(half);

    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold">🌐 {examTitle}</h2>
          <div className="text-slate-300 text-sm">
            <span className="text-red-400 font-bold text-lg">
              {answeredCount}
            </span>
            <span> / {questionNumbers.length} 問回答済み</span>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-6">受験者：{userName}</p>


        {/* PC：左右2列 / モバイル：縦1列 */}
        <div className="hidden md:flex gap-4 mb-8">
          <div className="flex-1 flex flex-col gap-4">
            {leftQuestions.map((qNum) => renderQuestionCard(qNum))}
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {rightQuestions.map((qNum) => renderQuestionCard(qNum))}
          </div>
        </div>

        {/* モバイル：縦1列 */}
        <div className="flex flex-col gap-4 mb-8 md:hidden">
          {questionNumbers.map((qNum) => renderQuestionCard(qNum))}
        </div>

        {/* 正解マスタアップロード（uploadモードのみ） */}
        {masterMode === "upload" && (
          <div
            onClick={() => correctInputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setCorrectFile(file);
            }}
            className={`border rounded-2xl p-6 cursor-pointer transition mb-6 ${
              correctFile
                ? "border-green-400/50 bg-green-500/10"
                : "border-white/20 bg-white/5 hover:border-red-400"
            }`}
          >
            <input
              ref={correctInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => setCorrectFile(e.target.files[0])}
              className="hidden"
            />
            <p className="font-bold text-white mb-2">正解マスタExcel</p>
            <p
              className={`p-3 rounded-xl text-center font-bold ${
                correctFile
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {correctFile
                ? `✔ ${correctFile.name}`
                : "ファイルをドラッグ＆ドロップ または クリックして選択"}
            </p>
          </div>
        )}

        {/* DB登録済みモードの場合は試験名を表示 */}
        {masterMode === "db" && (
          <div className="border border-green-400/50 bg-green-500/10 rounded-2xl p-4 mb-6">
            <p className="text-green-400 font-bold">
              🗄️ 登録済みマスタ使用：{examTitle}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setStep("setup")}
            className="px-6 py-4 rounded-2xl font-bold bg-white/10 text-slate-300 hover:bg-white/20 transition"
          >
            ← 戻る
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !allAnswered}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition duration-300 ${
              allAnswered && !loading
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:scale-105 shadow-2xl"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loading
              ? "採点中..."
              : allAnswered
                ? "採点スタート 🐎"
                : `残り ${questionNumbers.length - answeredCount} 問`}
          </button>
        </div>
      </div>
    );
  }
}
