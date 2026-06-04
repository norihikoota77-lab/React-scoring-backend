import { useRef } from "react";

export default function UploadCard({
  correctFile,
  userFile,
  setCorrectFile,
  setUserFile,
  handleSubmit,
  loading,
  passScore,
  setPassScore,
  submitted,
}) {
  const correctInputRef = useRef(null);
  const userInputRef = useRef(null);

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10">
      <h2 className="text-3xl font-extrabold mb-8 text-center">Excel採点</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 正解マスタアップロード */}
        <div
          onClick={() => correctInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) setCorrectFile(file);
          }}
          className="
            border
            border-white/20
            rounded-2xl
            p-6
            bg-white/5
            backdrop-blur-lg
            cursor-pointer
            transition
            duration-300
            hover:scale-105
            hover:shadow-red-500/40
            hover:border-red-400
            hover:bg-white/10
          "
        >
          <p className="font-bold text-white mb-2">正解マスタExcel</p>

          <input
            ref={correctInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => setCorrectFile(e.target.files[0])}
            className="hidden"
          />

          {/* 正解マスタ */}
          <p
            className={`mt-4 p-4 rounded-xl text-center font-bold transition ${
              submitted
                ? "bg-blue-500 text-white"
                : correctFile
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-slate-300"
            }`}
          >
            {submitted
              ? "✔ 採点完了"
              : correctFile
                ? `✔ ${correctFile.name}`
                : "ファイルをドラッグ＆ドロップ または クリックして選択"}
          </p>
        </div>

        {/* ユーザー解答アップロード */}
        <div
          onClick={() => userInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) setUserFile(file);
          }}
          className="
            border
            border-white/20
            rounded-2xl
            p-6
            bg-white/5
            backdrop-blur-lg
            cursor-pointer
            transition
            duration-300
            hover:scale-105
            hover:shadow-red-500/40
            hover:border-red-400
            hover:bg-white/10
          "
        >
          <p className="font-bold text-lg mb-4 text-white">ユーザー解答Excel</p>

          <input
            ref={userInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => setUserFile(e.target.files[0])}
            className="hidden"
          />

          {/* ユーザー解答 */}
          <p
            className={`mt-4 p-4 rounded-xl text-center font-bold transition ${
              submitted
                ? "bg-blue-500 text-white"
                : userFile
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-slate-300"
            }`}
          >
            {submitted
              ? "✔ 採点完了"
              : userFile
                ? `✔ ${userFile.name}`
                : "ファイルをドラッグ＆ドロップ または クリックして選択"}
          </p>
        </div>
      </div>

      {/* 合格ライン設定 */}
      <div className="mt-6 flex items-center gap-4">
        <label className="text-white font-bold">合格ライン</label>
        <input
          type="number"
          min="0"
          max="100"
          value={passScore}
          onChange={(e) => setPassScore(Number(e.target.value))}
          className="bg-slate-800 border border-white/20 px-4 py-2 rounded-xl text-white w-24 text-center"
        />
        <span className="text-white">%</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="
          w-full
          mt-8
          bg-gradient-to-r
          from-red-500
          to-pink-500
          hover:scale-105
          hover:shadow-red-500/40
          transition
          duration-300
          text-white
          font-bold
          py-4
          rounded-2xl
          shadow-2xl
          text-lg
        "
      >
        {loading ? "採点中..." : "採点スタート"}
      </button>
    </div>
  );
}
