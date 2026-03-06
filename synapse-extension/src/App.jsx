// src/App.jsx
import { useState, useEffect } from "react";
import { createDetector } from "./logic/detectorFactory";

function App({ platformConfig }) {
  // null = Initial (Grey)
  // true = Processing (Red)
  // false = Finished (Green)
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!platformConfig) return;

    const detector = createDetector((isBusy) => {
      // isBusy will be true (Red) or false (Green)
      setStatus(isBusy);
    }, platformConfig);

    detector.start();
    return () => detector.stop();
  }, [platformConfig]);

  // Optional: Click Green ✅ to reset back to Grey 🤖
  const handleReset = () => {
    if (status === false) setStatus(null);
  };

  // Helper to determine color and icon based on 3 states
  const getAppearance = () => {
    if (status === true)
      return { color: "#ff4d4d", icon: "⏳", title: "Processing..." }; // Red
    if (status === false)
      return { color: "#4dff88", icon: "✅", title: "Finished" }; // Green
    return { color: "#888", icon: "🤖", title: "Idle" }; // Grey (Default)
  };

  const appearance = getAppearance();

  const styles = {
    blob: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: appearance.color,
      // Pulse animation only when Red (Processing)
      boxShadow:
        status === true ? "0 0 15px #ff4d4d" : "0 4px 6px rgba(0,0,0,0.1)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      border: "2px solid white",
      fontSize: "20px",
      userSelect: "none",
    },
  };

  return (
    <div style={styles.blob} title={appearance.title} onClick={handleReset}>
      {appearance.icon}
    </div>
  );
}

export default App;
