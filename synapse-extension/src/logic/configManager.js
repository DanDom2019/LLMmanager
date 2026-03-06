const REMOTE_URL = "https://yourusername.github.io/synapse-ext/selectors.json";
const CACHE_KEY = "synapse_selector_config";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // Refresh every 6 hours

// --- Bundled fallback (always works offline) ---
const FALLBACK_CONFIG = {
  version: "0.0.1",
  platforms: {
    chatgpt: {
      hostname: "chatgpt.com",
      stopSelectors: ["button[data-testid='stop-button']"],
      sendSelectors: [
        "button[data-testid='send-button']",
        "#composer-submit-button",
      ],
      titleSelector: ".conversation-title",
    },
    claude: {
      hostname: "claude.ai",
      stopSelectors: ["button[aria-label='Stop']"],
      sendSelectors: ["button[aria-label='Send message']"],
      titleSelector: "nav .truncate",
    },
    gemini: {
      hostname: "gemini.google.com",
      stopSelectors: ["button[aria-label='Stop response']"],
      sendSelectors: ["button[aria-label='Send message']"],
      titleSelector: ".conversation-title",
    },
  },
};

export class ConfigManager {
  constructor() {
    this.config = null;
  }

  // Call this once when the extension loads
  async init() {
    this.config = await this._loadConfig();
    return this.config;
  }

  // Get selectors for the current page's platform
  getPlatformConfig() {
    const hostname = window.location.hostname;
    const platforms = this.config?.platforms || FALLBACK_CONFIG.platforms;

    for (const [, platformConfig] of Object.entries(platforms)) {
      if (hostname.includes(platformConfig.hostname)) {
        return platformConfig;
      }
    }
    return null; // Not a supported platform
  }

  async _loadConfig() {
    try {
      // 1. Check cache first
      const cached = await this._getCached();
      if (cached) return cached;

      // 2. Fetch remote
      const remote = await this._fetchRemote();
      if (remote) {
        await this._saveCache(remote);
        return remote;
      }
    } catch (err) {
      console.warn("[Synapse] Config load failed, using fallback:", err);
    }

    // 3. Use bundled fallback
    return FALLBACK_CONFIG;
  }

  async _fetchRemote() {
    const res = await fetch(REMOTE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async _getCached() {
    return new Promise((resolve) => {
      chrome.storage.local.get([CACHE_KEY], (result) => {
        const cached = result[CACHE_KEY];
        if (!cached) return resolve(null);

        const age = Date.now() - cached.savedAt;
        if (age > CACHE_TTL_MS) return resolve(null); // Expired

        console.log(`[Synapse] Using cached config v${cached.data.version}`);
        resolve(cached.data);
      });
    });
  }

  async _saveCache(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          [CACHE_KEY]: { data, savedAt: Date.now() },
        },
        resolve,
      );
    });
  }
}
