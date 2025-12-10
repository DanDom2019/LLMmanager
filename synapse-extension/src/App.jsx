import { useState } from "react";

function App() {
  // 0 = Idle (Grey), 1 = Thinking (Red), 2 = Ready (Green)
  const [status, setStatus] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Helper to cycle states for testing
  const cycleState = () => {
    setStatus((prev) => (prev + 1) % 3);
  };

  // Styles (Inline for simplicity in Phase 1)
  const styles = {
    blob: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor:
        status === 1 ? "#ff4d4d" : status === 2 ? "#4dff88" : "#888",
      boxShadow:
        status === 1 ? "0 0 10px #ff4d4d" : "0 4px 6px rgba(0,0,0,0.1)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      border: "2px solid white",
    },
    menu: {
      position: "absolute",
      bottom: "50px",
      right: "0",
      background: "white",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      minWidth: "150px",
      display: isOpen ? "block" : "none",
    },
  };

  return (
    <>
      {/* The Menu (Hidden by default) */}
      <div style={styles.menu}>
        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>Synapse Debug</h4>
        <button onClick={cycleState} style={{ padding: "5px", width: "100%" }}>
          Cycle State
        </button>
        <div style={{ fontSize: "10px", marginTop: "5px", color: "#666" }}>
          Current:{" "}
          {status === 1 ? "Thinking..." : status === 2 ? "Done!" : "Idle"}
        </div>
      </div>

      {/* The Floating Blob */}
      <div
        style={styles.blob}
        onClick={() => setIsOpen(!isOpen)}
        title="Synapse AI Manager"
      >
        {status === 1 ? "⏳" : status === 2 ? "✅" : "🤖"}
      </div>
    </>
  );
}

export default App;
