import { motion } from "framer-motion";

const HalfTable = ({ rows }) => (
  <div style={{ width: "100%" }}>
    <div style={{ display: "grid", gridTemplateColumns: "25% 25% 25% 25%", backgroundColor: "rgba(0,0,0,0.3)", padding: "6px 12px" }}>
      <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center",minWidth: 0, overflow: "hidden" }}>問題</span>
      <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center",minWidth: 0, overflow: "hidden" }}>解答</span>
      <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center",minWidth: 0, overflow: "hidden" }}>正解</span>
      <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", minWidth: 0, overflow: "hidden" }}>判定</span>
    </div>
    {rows.map((row, index) => {
      const isCorrect = row[3] === "\u2b55";
      return (
        <div key={index} style={{ display: "grid", gridTemplateColumns: "25% 25% 25% 25%", padding: "6px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ textAlign: "center", color: "#94a3b8", fontWeight: "bold", minWidth: 0, overflow: "hidden" }}>{row[0]}</span>
          <span style={{ textAlign: "center", color: "white", minWidth: 0, overflow: "hidden" }}>{row[1]}</span>
          <span style={{ textAlign: "center", color: "white", minWidth: 0, overflow: "hidden" }}>{row[2]}</span>
          <span style={{ textAlign: "center", fontWeight: "bold", minWidth: 0, overflow: "hidden", color: isCorrect ? "#4ade80" : "#f87171" }}>{row[3]}</span>
        </div>
      );
    })}
  </div>
);


export default function ResultTable({ rowsData }) {
  const mid = Math.ceil(rowsData.length / 2);
  const firstHalf = rowsData.slice(0, mid);
  const secondHalf = rowsData.slice(mid);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        marginTop: "24px",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "16px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        display: "flex",
        gap: "1px",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "50%", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
        <HalfTable rows={firstHalf} />
      </div>
      <div style={{ width: "50%" }}>
        <HalfTable rows={secondHalf} />
      </div>
    </motion.div>
  );
}