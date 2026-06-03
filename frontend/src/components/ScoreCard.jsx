import { motion } from "framer-motion";

export default function ScoreCard({
  title,
  value,
  color = "text-white",
  size = "text-6xl", 
  sub,
}) {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 40,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        duration: 0.5,
      }}

      whileHover={{
        y: -8,
        scale: 1.03,
      }}

      className="
        bg-white/10
        backdrop-blur-xl
        border
        border-white/20
        rounded-3xl
        p-8
        text-center
        shadow-2xl
      "
    >

      <p className="text-sm text-slate-300 mb-3">

        {title}

      </p>

      <p className={`${size} font-extrabold ${color}`}>
        {value}
        {sub && (
          <span className="text-2xl font-normal text-slate-400 ml-1">
            {sub}
          </span>
        )}
      </p>

    </motion.div>
  );
}