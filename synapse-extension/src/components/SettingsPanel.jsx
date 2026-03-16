export function SettingsPanel({ settings, onUpdate, hostname, onClose }) {
  const s = {
    panel: {
      position: "absolute",
      bottom: "52px",
      right: 0,
      background: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "12px",
      padding: "14px 16px",
      width: "220px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      color: "#fff",
      fontSize: "13px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
    },
    title: { fontWeight: 600, fontSize: "13px", color: "#eee" },
    closeBtn: {
      background: "none",
      border: "none",
      color: "#888",
      cursor: "pointer",
      fontSize: "14px",
      padding: 0,
      lineHeight: 1,
    },
    sectionLabel: {
      color: "#aaa",
      fontSize: "11px",
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "3px 0",
    },
    rowLabel: { color: "#ccc", fontSize: "12px" },
    divider: { borderColor: "#333", margin: "8px 0" },
  };

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>Synapse Notifications</span>
        <button style={s.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <div>
        <div style={s.sectionLabel}>🔔 Sound</div>
        <div style={s.row}>
          <span style={s.rowLabel}>Global</span>
          <input
            type="checkbox"
            checked={settings.sound.enabled}
            onChange={(e) => onUpdate(["sound", "enabled"], e.target.checked)}
          />
        </div>
        <div style={s.row}>
          <span style={s.rowLabel}>This platform</span>
          <input
            type="checkbox"
            checked={settings.sound.perPlatform[hostname]?.enabled ?? true}
            disabled={!settings.sound.enabled}
            onChange={(e) =>
              onUpdate(
                ["sound", "perPlatform", hostname, "enabled"],
                e.target.checked
              )
            }
          />
        </div>
      </div>

      <hr style={s.divider} />

      <div>
        <div style={s.sectionLabel}>💬 Popup</div>
        <div style={s.row}>
          <span style={s.rowLabel}>Global</span>
          <input
            type="checkbox"
            checked={settings.popup.enabled}
            onChange={(e) => onUpdate(["popup", "enabled"], e.target.checked)}
          />
        </div>
        <div style={s.row}>
          <span style={s.rowLabel}>This platform</span>
          <input
            type="checkbox"
            checked={settings.popup.perPlatform[hostname]?.enabled ?? true}
            disabled={!settings.popup.enabled}
            onChange={(e) =>
              onUpdate(
                ["popup", "perPlatform", hostname, "enabled"],
                e.target.checked
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
