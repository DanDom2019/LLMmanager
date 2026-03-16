import { useState, useEffect, useCallback } from "react";
import {
  loadSettings,
  saveSettings,
  ensurePlatformDefaults,
  SETTINGS_KEY,
} from "../logic/notificationSettings";

// Immutably sets a value at a path expressed as an array of keys.
// Handles keys that contain dots (e.g. "chatgpt.com") correctly.
function setNestedValue(obj, keys, value) {
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }
  return {
    ...obj,
    [keys[0]]: setNestedValue(obj[keys[0]] ?? {}, keys.slice(1), value),
  };
}

export function useNotificationSettings(hostname) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    loadSettings().then((loaded) => {
      const merged = ensurePlatformDefaults(loaded, hostname);
      if (merged !== loaded) saveSettings(merged);
      setSettings(merged);
      setLoading(false);
    });
  }, [hostname]);

  // Cross-tab sync: when another tab writes settings, pull the new value
  useEffect(() => {
    const listener = (changes, area) => {
      if (area !== "local" || !changes[SETTINGS_KEY]) return;
      setSettings(changes[SETTINGS_KEY].newValue);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // path is an array of keys, e.g. ["sound", "enabled"] or
  // ["sound", "perPlatform", "chatgpt.com", "enabled"]
  const updateSetting = useCallback((path, value) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = setNestedValue(prev, path, value);
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSetting, loading };
}
