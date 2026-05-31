import { useEffect, useState } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import Header from "./components/Header";
import UploadCard from "./components/UploadCard";
import ResultTable from "./components/ResultTable";
import ScoreCard from "./components/ScoreCard";
import ResultMessage from "./components/ResultMessage";
import HistoryChart from "./components/HistoryChart";
import heroImage from "./assets/hero_top.png";


export default function App() {
  const [correctFile, setCorrectFile] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [histories, setHistories] = useState([]);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedExam, setSelectedExam] = useState("ALL"); // ★追加
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchHistories = async () => {
    try {
      const response = await fetch("https://react-scoring-backend.onrender.com/api/history/");
      const data = await response.json();
      setHistories(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  const deleteHistory = async (id) => {
    try {
      await fetch(`https://react-scoring-backend.onrender.com/api/history/delete/${id}/`, {
        method: "DELETE",
      });
      fetchHistories();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    setResult(null);
    if (!correctFile || !userFile) {
      alert("ファイルを選択してください");
      return;
    }

    const formData = new FormData();
    formData.append("correct_file", correctFile);
    formData.append("user_file", userFile);

    try {
      setLoading(true);
      const response = await fetch("https://react-scoring-backend.onrender.com/api/score/", {
        method: "POST",
        body: formData,
      });
      const text = await response.text();
      console.log(text);
      const data = JSON.parse(text);

      // ★ エラーチェック追加
      if (data.error) {
        alert(data.error);
        return;
      }

      setResult(data);
      await fetchHistories();
      setCorrectFile(null);
      setUserFile(null);
    } catch (error) {
      console.error(error);
      alert("通信エラー");
    } finally {
      setLoading(false);
    }
  };

  const users = [
    "ALL",
    ...new Set(histories.map((h) => h.user_name)),
  ];

  // ★ 試験名リスト
  const exams = [
    "ALL",
    ...new Set(histories.map((h) => h.exam_title)),
  ];

  // ★ ユーザー＋試験名で絞り込み
  const filteredHistories = histories
    .filter((h) => selectedUser === "ALL" || h.user_name === selectedUser)
    .filter((h) => selectedExam === "ALL" || h.exam_title === selectedExam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-red-950 text-white">
      {loading && <LoadingSpinner />}

      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* ヒーロー画像 ← returnの中に移動 */}
        <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={heroImage}
            alt="競馬演出スコアラー"
            className="w-full object-cover h-64 md:h-80"
          />
        </div>

        <UploadCard
          correctFile={correctFile}
          userFile={userFile}
          setCorrectFile={setCorrectFile}
          setUserFile={setUserFile}
          handleSubmit={handleSubmit}
          loading={loading}
        />

        {result && (
          <>
            {/* 1. 採点結果 */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 mt-8 text-white">
              <h2 className="text-3xl font-extrabold mb-6">採点結果</h2>
              <div className="mb-6">
                <p className="text-2xl font-bold text-red-300">{result.user_name}</p>
                <p className="text-slate-300 text-lg">{result.exam_title}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <ScoreCard title="スコア" value={result.score} />
                <ScoreCard
                  title="正答率"
                  value={`${Number(result.percentage).toFixed(1)}%`}
                  color="text-red-400"
                />
                <ScoreCard
                  title="ランク"
                  value={result.rank}
                  color="text-yellow-300"
                />
              </div>
              <ResultMessage rank={result.rank} message={result.msg} />
            </div>

            {/* 2. 動画 */}
            {result.video_file && (
              <div className="mt-8">
                <video
                  autoPlay
                  loop
                  muted
                  controls
                  className="w-full rounded-3xl shadow-2xl border border-white/20"
                >
                  <source
                    src={`https://react-scoring-backend.onrender.com/static/${result.video_file}`}
                    type="video/mp4"
                  />
                </video>
              </div>
            )}

            {/* 3. 採点詳細 */}
            {result.rows_data && (
              <ResultTable rowsData={result.rows_data} />
            )}

            {/* 4. 正答率推移 */}
            <div className="mt-8">
              <HistoryChart
                histories={filteredHistories}
                selectedUser={result.user_name}
              />
            </div>
          </>
        )}

        {/* =========================
              HISTORY AREA
        ========================== */}
        <div className="mt-10">
          {selectedHistory && (
            <div className="mb-8 bg-red-500/10 border border-red-400/30 rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-4">履歴詳細</h2>
              <p className="text-5xl font-extrabold text-red-400 mb-3">
                {Number(selectedHistory.percentage).toFixed(1)}%
              </p>
              <p className="text-xl">ランク：{selectedHistory.rank}</p>
              <p className="mt-4 text-slate-300">{selectedHistory.message}</p>
            </div>
          )}

          {/* ★ フィルター：ユーザー＋試験名を横並び */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-800 border border-white/20 px-4 py-3 rounded-xl"
            >
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>

            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-slate-800 border border-white/20 px-4 py-3 rounded-xl"
            >
              {exams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          <h2 className="text-3xl font-bold mb-6 mt-4">採点履歴</h2>

          <a
            href="https://react-scoring-backend.onrender.com/api/history/export/"
            target="_blank"
            rel="noreferrer"
            className="inline-block mb-6 bg-green-500 hover:bg-green-600 px-5 py-3 rounded-2xl font-bold transition"
          >
            CSVダウンロード
          </a>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredHistories.map((history) => (
              <div
                key={history.id}
                onClick={() => setSelectedHistory(history)}
                className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-lg hover:scale-105 hover:border-red-400 cursor-pointer transition duration-300"
              >
                <div className="flex justify-between mb-3">
                  <p className="font-bold text-xl">{history.rank}</p>
                  <p className="text-slate-300 text-sm">{history.created_at}</p>
                </div>
                <p className="text-2xl font-extrabold text-red-400 mb-2">
                  {Number(history.percentage).toFixed(1)}%
                </p>
                <p className="text-xl font-bold text-red-300">{history.user_name}</p>
                <p className="text-slate-300 mb-2">{history.exam_title}</p>
                <p className="text-slate-200">{history.message}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHistory(history.id);
                  }}
                  className="mt-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold transition"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}