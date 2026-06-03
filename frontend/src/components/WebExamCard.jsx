import { useState, useRef } from "react";

const API_BASE = "https://react-scoring-backend.onrender.com";

const NUMERIC_CHOICES = ["1", "2", "3", "4", "5"];
const ALPHA_CHOICES = ["A", "B", "C", "D", "E"];

export default function WebExamCard({ setResult, fetchHistories }) {
  const [step, setStep] = useState("setup");
  const [userName, setUserName] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(40);
  const [choiceType, setChoiceType] = useState("numeric");
  const [answers, setAnswers] = useState({});
  const [correctFile, setCorrectFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const correctInputRef = useRef(null);

  const choices = choiceType === "numeric" ? NUMERIC_CHOICES : ALPHA_CHOICES;

  const handleSetup = () => {
    if (!userName.trim()) { alert("受験者名を入力してください"); return; }
    if (!examTitle.trim()) { alert("試験名を入力してください"); return; }
    if (questionCount < 1 || questionCount > 200) { alert("問題数は1〜200の範囲で入力してください"); return; }
    setAnswers({});
    setStep("answering");
  };

  const handleAnswer = (qNum, choice) => {
    setAnswers((prev) => ({ ...prev, [qNum]: choice }));
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questionCount;

  const handleSubmit = async () => {
    if (!correctFile) { alert("正解マスタExcelを選択してください"); return; }

    const formData = new FormData();
    formData.append("correct_file", correctFile);
    formData.append("user_name", userName);
    formData.append("exam_title", examTitle);
    formData.append("answers", JSON.stringify(answers));
    formData.append("question_count", questionCount);

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/score/web/`, {
        method: "POST",
        body: formData,
      });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.error) { alert(data.error); return; }
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

  const renderQuestionCard = (qNum) => (
    <div
      key={qNum}
      className={`border rounded-2xl p-4 transition ${
        answers[qNum]
          ? "border-green-400/50 bg-green-500/10"
          : "border-white/20 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-300">問題 {qNum}</span>
        {answers[qNum] && (
          <span className="text-green-400 font-bold text-sm">✓ {answers[qNum]}</span>
        )}
      </div>
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

  // ============================================================
  // STEP 1：セットアップ画面
  // ============================================================
  if (step === "setup") {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10">
        <h2 className="text-3xl font-extrabold mb-8 text-center">🌐 Web解答</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">受験者名</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="例：坂井"
              className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">試験名</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="例：python模擬試験"
              className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">問題数</label>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              min="1"
              max="200"
              className="w-full bg-slate-800 border border-white/20 px-4 py-3 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-bold mb-2 block">選択肢タイプ</label>
            <div className="flex gap-3">
              <button
                onClick={() => setChoiceType("numeric")}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  choiceType === "numeric" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                1〜5
              </button>
              <button
                onClick={() => setChoiceType("alpha")}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  choiceType === "alpha" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                A〜E
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSetup}
          className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition duration-300 text-white font-bold py-4 rounded-2xl shadow-2xl text-lg"
        >
          解答をはじめる
        </button>
      </div>
    );
  }

  // ============================================================
  // STEP 2：解答画面
  // ============================================================
  if (step === "answering") {
    const half = Math.ceil(questionCount / 2);
    const leftQuestions = Array.from({ length: half }, (_, i) => i + 1);
    const rightQuestions = Array.from({ length: questionCount - half }, (_, i) => half + i + 1);

    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold">🌐 {examTitle}</h2>
          <div className="text-slate-300 text-sm">
            <span className="text-red-400 font-bold text-lg">{answeredCount}</span>
            <span> / {questionCount} 問回答済み</span>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-6">受験者：{userName}</p>

        {/* 問題一覧：左右2列で縦に並べる */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 flex flex-col gap-4">
            {leftQuestions.map((qNum) => renderQuestionCard(qNum))}
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {rightQuestions.map((qNum) => renderQuestionCard(qNum))}
          </div>
        </div>

        {/* 正解マスタアップロード */}
        <div
          onClick={() => correctInputRef.current.click()}
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
          <p className={`p-3 rounded-xl text-center font-bold ${
            correctFile ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"
          }`}>
            {correctFile ? `✔ ${correctFile.name}` : "ファイルを選択してください"}
          </p>
        </div>

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
            {loading ? "採点中..." : allAnswered ? "採点スタート 🐎" : `残り ${questionCount - answeredCount} 問`}
          </button>
        </div>
      </div>
    );
  }
}