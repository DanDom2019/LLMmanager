export function SettingsToggle({ onClick }) {
  const style = {
    position: "absolute",
    top: "-6px",
    left: "-6px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.5)",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    color: "#ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 1,
  };

  return (
    <button style={style} onClick={onClick} title="Notification settings">
      ⚙
    </button>
  );
}
