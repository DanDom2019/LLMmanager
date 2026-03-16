export const SETTINGS_KEY = "synapse_notification_settings";

export const DEFAULT_SETTINGS = {
  sound: {
    enabled: true,
    volume: 0.8,
    selectedSound: "ding",
    perPlatform: {
      "chatgpt.com": { enabled: true },
      "claude.ai": { enabled: true },
      "gemini.google.com": { enabled: true },
    },
  },
  popup: {
    enabled: true,
    durationMs: 4000,
    perPlatform: {
      "chatgpt.com": { enabled: true },
      "claude.ai": { enabled: true },
      "gemini.google.com": { enabled: true },
    },
  },
};

// Recursively merges `stored` onto `defaults`, so every key in defaults
// is guaranteed to exist in the result even if missing from stored.
function deepMerge(defaults, stored) {
  const result = { ...defaults };
  for (const key of Object.keys(stored)) {
    const storedVal = stored[key];
    const defaultVal = defaults[key];
    if (
      storedVal !== null &&
      typeof storedVal === "object" &&
      !Array.isArray(storedVal) &&
      defaultVal !== null &&
      typeof defaultVal === "object"
    ) {
      result[key] = deepMerge(defaultVal, storedVal);
    } else {
      result[key] = storedVal;
    }
  }
  return result;
}

// Ensures a new platform hostname has default entries in both perPlatform maps.
// Returns the original object unchanged if no additions were needed.
export function ensurePlatformDefaults(settings, hostname) {
  if (!hostname) return settings;

  const needsSound = !settings.sound.perPlatform[hostname];
  const needsPopup = !settings.popup.perPlatform[hostname];
  if (!needsSound && !needsPopup) return settings;

  return deepMerge(settings, {
    sound: { perPlatform: { [hostname]: { enabled: true } } },
    popup: { perPlatform: { [hostname]: { enabled: true } } },
  });
}

export function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      const stored = result[SETTINGS_KEY];
      resolve(stored ? deepMerge(DEFAULT_SETTINGS, stored) : DEFAULT_SETTINGS);
    });
  });
}

export function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, resolve);
  });
}
