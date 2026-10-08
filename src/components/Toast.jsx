import { motion } from "framer-motion";

const styles = {
  success: {
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.4)",
    color: "#10b981",
    icon: "✅",
  },
  error: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#ef4444",
    icon: "⚠️",
  },
  info: {
    background: "rgba(100, 116, 139, 0.12)",
    border: "1px solid rgba(100, 116, 139, 0.3)",
    color: "rgba(160, 170, 200, 0.8)",
    icon: "ℹ️",
  },
};

export default function Toast({ message, type = "success" }) {
  const s = styles[type] || styles.info;

  return (
    <div className="toast-container">
      <motion.div
        initial={{ y: -60, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -60, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 20px",
          borderRadius: "14px",
          background: s.background,
          border: s.border,
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          maxWidth: "360px",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "18px" }}>{s.icon}</span>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: s.color,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {message}
        </span>
      </motion.div>
    </div>
  );
}
