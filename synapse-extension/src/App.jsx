import { useState, useEffect } from "react";
import { LLMDetector } from "./logic/detectors";

function App() {
  // 0 = Idle (Grey), 1 = Thinking (Red), 2 = Ready (Green)
  const [status, setStatus] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initialize the detector
    const detector = new LLMDetector((newStatus) => {
      if (newStatus === "thinking") {
        setStatus(1); // Red
      } else {
        // When it goes from Thinking -> Idle, that means it's READY (Green)
        setStatus((prev) => (prev === 1 ? 2 : 0));
      }
    });

    detector.start();

    // Cleanup when component unmounts
    return () => detector.stop();
  }, []);

  // Reset to Idle (Grey) when you click the Green checkmark
  const handleAck = () => {
    if (status === 2) setStatus(0);
    setIsOpen(!isOpen);
  };

  const styles = {
    blob: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor:
        status === 1 ? "#ff4d4d" : status === 2 ? "#4dff88" : "#888",
      boxShadow:
        status === 1 ? "0 0 15px #ff4d4d" : "0 4px 6px rgba(0,0,0,0.1)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      border: "2px solid white",
      fontSize: "20px",
    },
  };

  return (
    <div
      style={styles.blob}
      onClick={handleAck}
      title={status === 1 ? "Thinking..." : "Idle"}
    >
      {status === 1 ? "⏳" : status === 2 ? "✅" : "🤖"}
    </div>
  );
}

export default App;
