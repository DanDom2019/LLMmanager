import { useEffect } from "react";

export function Toast({ visible, durationMs, onDismiss }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss]);

  if (!visible) return null;

  const styles = {
    container: {
      position: "absolute",
      bottom: "52px",
      right: 0,
      background: "#1a1a1a",
      color: "#fff",
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "13px",
      whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: "1px solid #333",
    },
    icon: { fontSize: "16px" },
    dismiss: {
      background: "none",
      border: "none",
      color: "#888",
      cursor: "pointer",
      fontSize: "14px",
      padding: "0 0 0 4px",
      lineHeight: 1,
    },
  };

  return (
    <div style={styles.container}>
      <span style={styles.icon}>✅</span>
      <span>Response ready</span>
      <button style={styles.dismiss} onClick={onDismiss} title="Dismiss">
        ✕
      </button>
    </div>
  );
}
