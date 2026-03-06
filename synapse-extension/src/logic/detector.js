// detector.js - now config-driven
export class ChatGPTDetector {
  constructor(onStatusChange, platformConfig) {
    this.onStatusChange = onStatusChange;
    this.platformConfig = platformConfig; // injected from ConfigManager
    this.isGenerating = false;
    this.observer = null;
    this.checkInterval = null;
  }

  findButton() {
    const { stopSelectors, sendSelectors } = this.platformConfig;

    // Check stop buttons first
    for (const selector of stopSelectors) {
      const btn = this._findVisible(selector);
      if (btn) return { button: btn, type: "stop" };
    }

    // Then send buttons
    for (const selector of sendSelectors) {
      const btn = this._findVisible(selector);
      if (btn) return { button: btn, type: "send" };
    }

    return null;
  }

  _findVisible(selector) {
    const buttons = document.querySelectorAll(selector);
    for (const btn of buttons) {
      if (btn.offsetWidth > 0 && btn.offsetHeight > 0) return btn;
    }
    return null;
  }

  checkState() {
    const found = this.findButton();
    let newState = false;

    if (found) {
      const { button, type } = found;
      if (type === "stop") newState = true;
      if (type === "send" && button.disabled) newState = true;
    }

    if (newState !== this.isGenerating) {
      this.isGenerating = newState;
      this.onStatusChange(newState);

      // Notify service worker about status change
      this._notifyServiceWorker(newState);
    }
  }

  _notifyServiceWorker(isGenerating) {
    const status = isGenerating ? "generating" : "complete";
    const platform = this.platformConfig.hostname.split(".")[0]; // chatgpt, claude, gemini

    chrome.runtime
      .sendMessage({
        type: "STATUS_UPDATE",
        status,
        platform,
      })
      .catch((err) => {
        console.warn("[Detector] Failed to notify service worker:", err);
      });
  }

  start() {
    console.log("[Synapse Detector] Starting...");

    // Initial check
    this.checkState();

    // Periodic polling (fallback)
    this.checkInterval = setInterval(() => this.checkState(), 500);

    // MutationObserver for real-time detection
    this.observer = new MutationObserver(() => this.checkState());
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-label"],
    });
  }

  stop() {
    console.log("[Synapse Detector] Stopping...");

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
