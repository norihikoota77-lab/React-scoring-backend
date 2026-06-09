import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#4ade80", "#f87171"];

export default function Dashboard({
  histories,
  users,
  exams,
  selectedUser,
  selectedExam,
  setSelectedUser,
  setSelectedExam,
}) {

  const tooltipStyle = {
    contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px" },
    labelStyle: { color: "#fff" },
  };

  // ============================================================
  // フィルター
  // ============================================================
  const FilterBar = () => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      <span className="text-slate-300 text-sm font-bold">🔍 フィルター</span>
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        className="bg-slate-800 border border-white/20 px-4 py-2 rounded-xl text-white text-sm"
      >
        {users.map((user) => (
          <option key={user} value={user}>{user}</option>
        ))}
      </select>
      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="bg-slate-800 border border-white/20 px-4 py-2 rounded-xl text-white text-sm"
      >
        {exams.map((exam) => (
          <option key={exam} value={exam}>{exam}</option>
        ))}
      </select>
      {(selectedUser !== "ALL" || selectedExam !== "ALL") && (
        <button
          onClick={() => { setSelectedUser("ALL"); setSelectedExam("ALL"); }}
          className="bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 px-3 py-2 rounded-xl text-red-300 text-sm transition"
        >
          ✕ リセット
        </button>
      )}
      <span className="text-slate-400 text-sm ml-auto">{histories.length} 件</span>
    </div>
  );

  if (!histories || histories.length === 0) {
    return (
      <div>
        <FilterBar />
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center text-slate-300">
          <p className="text-2xl mb-2">📊</p>
          <p>採点履歴がありません</p>
        </div>
      </div>
    );
  }

  // 集計データ
  const totalCount = histories.length;
  const avgPercentage = (
    histories.reduce((sum, h) => sum + Number(h.percentage), 0) / totalCount
  ).toFixed(1);
  const passCount = histories.filter((h) => h.rank === "S" || h.rank === "A").length;
  const passRate = ((passCount / totalCount) * 100).toFixed(1);
  const uniqueUsers = new Set(histories.map((h) => h.user_name)).size;

  // 受験者ごとの平均正答率
  const userMap = {};
  histories.forEach((h) => {
    if (!userMap[h.user_name]) userMap[h.user_name] = [];
    userMap[h.user_name].push(Number(h.percentage));
  });
  const userChartData = Object.entries(userMap).map(([name, scores]) => ({
    name,
    平均正答率: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
  }));

  // 試験ごとの平均点
  const examMap = {};
  histories.forEach((h) => {
    if (!examMap[h.exam_title]) examMap[h.exam_title] = [];
    examMap[h.exam_title].push(Number(h.percentage));
  });
  const examChartData = Object.entries(examMap).map(([title, scores]) => ({
    name: title.length > 10 ? title.slice(0, 10) + "…" : title,
    平均正答率: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
  }));

  // 合格・不合格
  const pieData = [
    { name: "合格（A以上）", value: passCount },
    { name: "不合格", value: totalCount - passCount },
  ];

  // ランク分布
  const rankMap = { S: 0, A: 0, B: 0, C: 0 };
  histories.forEach((h) => {
    if (rankMap[h.rank] !== undefined) rankMap[h.rank]++;
  });
  const rankChartData = Object.entries(rankMap).map(([rank, count]) => ({ name: rank, count }));
  const rankColors = { S: "#F1C40F", A: "#4ade80", B: "#60a5fa", C: "#f87171" };

  return (
    <div className="space-y-4 md:space-y-6">

      {/* フィルター */}
      <FilterBar />

      {/* 集計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "総採点回数", value: totalCount, icon: "📋", color: "text-white" },
          { label: "受験者数", value: uniqueUsers, icon: "👤", color: "text-white" },
          { label: "平均正答率", value: `${avgPercentage}%`, icon: "📊", color: "text-red-400" },
          { label: "合格率", value: `${passRate}%`, icon: "✅", color: "text-green-400" },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6 text-center shadow-xl"
          >
            <p className="text-xl md:text-2xl mb-1">{icon}</p>
            <p className="text-slate-300 text-xs md:text-sm mb-1">{label}</p>
            <p className={`text-2xl md:text-3xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* 棒グラフ2つ横並び */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 md:p-6 shadow-2xl">
          <h3 className="text-base md:text-xl font-bold mb-4">👤 受験者ごとの平均正答率</h3>
          <div className="h-[200px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userChartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="平均正答率" fill="#f43f5e" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fill: "#e2e8f0", fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 md:p-6 shadow-2xl">
          <h3 className="text-base md:text-xl font-bold mb-4">📝 試験ごとの平均正答率</h3>
          <div className="h-[200px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examChartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="平均正答率" fill="#60a5fa" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fill: "#e2e8f0", fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 円グラフ＋ランク分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 md:p-6 shadow-2xl">
          <h3 className="text-base md:text-xl font-bold mb-4">✅ 合格・不合格の割合</h3>
          <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend
                  wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                  formatter={(value) => <span style={{ color: "#94a3b8" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 md:p-6 shadow-2xl">
          <h3 className="text-base md:text-xl font-bold mb-4">🏆 ランク分布</h3>
          <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankChartData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 14 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fill: "#e2e8f0", fontSize: 11 }}
                >
                  {rankChartData.map((entry) => (
                    <Cell key={entry.name} fill={rankColors[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
