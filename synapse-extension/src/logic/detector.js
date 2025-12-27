// src/logic/detector.js

export class ChatGPTDetector {
  constructor(onStatusChange) {
    this.onStatusChange = onStatusChange;
    this.isGenerating = false;
    this.observer = null;
    this.checkInterval = null;

    // Standard Selectors
    this.selectors = [
      'button[data-testid="send-button"]',
      'button[data-testid="stop-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Stop generating"]',
      "#composer-submit-button",
    ];
  }

  start() {
    console.log("[Synapse] Binary Detector Started");
    // 1. Observe the body for changes (buttons appearing/disappearing)
    this.observer = new MutationObserver(() => this.checkState());
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "data-testid", "aria-label"],
    });

    // 2. Backup: Check every 1 second just in case MutationObserver misses an attribute change
    this.checkInterval = setInterval(() => this.checkState(), 1000);
  }

  stop() {
    if (this.observer) this.observer.disconnect();
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  findButton() {
    for (const selector of this.selectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button.offsetWidth > 0 && button.offsetHeight > 0) {
          return button;
        }
      }
    }
    return null;
  }

  checkState() {
    const button = this.findButton();
    let newState = false; // Default to IDLE (Green)

    if (button) {
      const testId = button.getAttribute("data-testid") || "";
      const ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();
      const isDisabled = button.disabled;

      // Logic derived from ChatDinger
      // A. It's a "Stop" button -> BUSY
      const isStop = testId.includes("stop") || ariaLabel.includes("stop");

      // B. It's a "Send" button but Disabled -> BUSY
      const isSendDisabled =
        (testId.includes("send") || ariaLabel.includes("send")) && isDisabled;

      if (isStop || isSendDisabled) {
        newState = true; // Processing (Red)
      }
    }
    // Note: If NO button is found, newState remains 'false' (Green/Idle), effectively acting as the Fail-Safe.

    // Only update if state actually changed
    if (newState !== this.isGenerating) {
      this.isGenerating = newState;
      console.log(
        `[Synapse] State: ${newState ? "🔴 PROCESSING" : "🟢 FINISHED"}`
      );
      this.onStatusChange(newState);
    }
  }
}
