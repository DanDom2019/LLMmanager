import { useState, useEffect, useRef, useCallback } from "react";
import { createDetector } from "./logic/detectorFactory";
import { notificationManager } from "./logic/notificationManager";
import { useNotificationSettings } from "./hooks/useNotificationSettings";
import { Toast } from "./components/Toast";
import { SettingsToggle } from "./components/SettingsToggle";
import { SettingsPanel } from "./components/SettingsPanel";

function App({ platformConfig }) {
  // null = Idle (grey), true = Processing (red), false = Finished (green)
  const [status, setStatus] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastDuration, setToastDuration] = useState(4000);
  const [panelOpen, setPanelOpen] = useState(false);

  const { settings, updateSetting, loading } = useNotificationSettings(
    platformConfig?.hostname
  );

  // Ref so the detector callback always reads the latest settings without
  // needing to be recreated every time settings change
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Ref to track previous status for true → false transition detection
  const prevStatus = useRef(null);

  // Register toast callback on the manager once
  useEffect(() => {
    notificationManager.onToastRequest((durationMs) => {
      setToastDuration(durationMs);
      setToastVisible(true);
    });
  }, []);

  // Start detector
  useEffect(() => {
    if (!platformConfig) return;

    const detector = createDetector((isBusy) => {
      const justFinished = prevStatus.current === true && isBusy === false;
      prevStatus.current = isBusy;
      setStatus(isBusy);

      if (justFinished && settingsRef.current) {
        notificationManager.notify(
          platformConfig.hostname,
          settingsRef.current,
          { tabVisible: document.visibilityState === "visible" }
        );
      }
    }, platformConfig);

    detector.start();
    return () => detector.stop();
  }, [platformConfig]);

  const handleReset = () => {
    if (status === false) setStatus(null);
  };

  const handleDismissToast = useCallback(() => setToastVisible(false), []);

  const handleTogglePanel = useCallback((e) => {
    e.stopPropagation();
    setPanelOpen((open) => !open);
  }, []);

  const getAppearance = () => {
    if (status === true)
      return { color: "#ff4d4d", icon: "⏳", title: "Processing..." };
    if (status === false)
      return { color: "#4dff88", icon: "✅", title: "Finished" };
    return { color: "#888", icon: "🤖", title: "Idle" };
  };

  const appearance = getAppearance();

  const blobStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: appearance.color,
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
    position: "relative",
  };

  return (
    <div style={{ position: "relative" }}>
      {toastVisible && (
        <Toast
          visible={toastVisible}
          durationMs={toastDuration}
          onDismiss={handleDismissToast}
        />
      )}

      {panelOpen && !loading && settings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSetting}
          hostname={platformConfig?.hostname}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <div style={blobStyle} title={appearance.title} onClick={handleReset}>
        {appearance.icon}
        <SettingsToggle onClick={handleTogglePanel} />
      </div>
    </div>
  );
}

export default App;
