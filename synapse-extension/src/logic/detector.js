// src/logic/detectors.js

export class LLMDetector {
  constructor(onStatusChange) {
    this.onStatusChange = onStatusChange; // Callback function to update React UI
    this.intervalId = null;
    this.currentStatus = "idle"; // 'idle' or 'thinking'
  }

  start() {
    console.log("Synapse: Detector Started");
    // Check every 500ms
    this.intervalId = setInterval(() => this.check(), 500);
  }

  stop() {
    clearInterval(this.intervalId);
  }

  check() {
    const isThinking = this.detectThinking();
    const newStatus = isThinking ? "thinking" : "idle";

    if (newStatus !== this.currentStatus) {
      this.currentStatus = newStatus;
      this.onStatusChange(newStatus); // Tell React to change color!
    }
  }

  detectThinking() {
    const url = window.location.hostname;

    // --- STRATEGY 1: ChatGPT ---
    if (url.includes("chatgpt.com")) {
      // Look for the "Stop generating" button.
      // OpenAI usually gives it an aria-label or specific data-testid.
      const stopButton = document.querySelector(
        'button[aria-label="Stop generating"]'
      );
      const stopButtonAlt = document.querySelector(
        'button[data-testid="stop-button"]'
      );

      // Also look for the black/white square icon usually associated with "Stop"
      // (This is a bit fuzzier, but often works if attributes fail)
      const hasSquareIcon = !!document.querySelector("button svg rect");

      if (stopButton || stopButtonAlt) return true;
    }

    // --- STRATEGY 2: Gemini ---
    if (url.includes("gemini.google.com")) {
      // Gemini often changes, but usually has a specific aria-label for the stop button
      // or a specific animation container.
      const stopButton = document.querySelector(
        'button[aria-label="Stop response"]'
      );

      // Gemini's "Thinking" spinner often has a specific class or role
      const spinner = document.querySelector(".mat-mdc-progress-spinner");

      if (stopButton || spinner) return true;
    }

    // --- STRATEGY 3: Claude ---
    if (url.includes("claude.ai")) {
      // Claude is usually very clean with data-testids
      const stopButton = document.querySelector(
        'button[data-testid="stop-generating-button"]'
      );
      if (stopButton) return true;
    }

    return false;
  }
}

// src/logic/detectors.js

export class ChatGPTDetector {
  constructor(onStatusChange) {
    this.onStatusChange = onStatusChange;
    this.status = "IDLE"; // IDLE, THINKING, GENERATING
    this.lastTextLength = 0;
    this.textCheckInterval = null;

    // 1. SELECTORS (Stolen from ChatDinger's content.js)
    // We start with these, but we can update them remotely later.
    this.selectors = [
      "#composer-submit-button",
      'button[data-testid$="send-button"]',
      'button[data-testid$="stop-button"]',
    ];
  }

  start() {
    this.observeButton();
    // Check text growth every 100ms to distinguish Thinking vs Generating
    this.textCheckInterval = setInterval(() => this.checkTextGrowth(), 100);
  }

  stop() {
    if (this.observer) this.observer.disconnect();
    clearInterval(this.textCheckInterval);
  }

  // --- LAYER 1: BUTTON STATE (From ChatDinger) ---

  findButton() {
    // Logic adapted from findChatGPTButton in ChatDinger
    for (const selector of this.selectors) {
      const buttons = document.querySelectorAll(selector);
      for (const button of buttons) {
        if (button.offsetWidth > 0 && button.offsetHeight > 0) {
          // Check visibility
          return button;
        }
      }
    }
    return null;
  }

  observeButton() {
    // We use a global observer on the body to catch when the button is re-rendered
    // (ChatDinger uses specific parent observers, but global is safer for React apps)
    this.observer = new MutationObserver(() => {
      const button = this.findButton();
      if (button) this.processButtonState(button);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "data-testid", "aria-label"], // Watch for state changes
    });
  }

  processButtonState(button) {
    // Logic adapted from getChatGPTButtonState
    const testId = button.getAttribute("data-testid") || "";
    const isDisabled = button.disabled;
    const ariaLabel = button.getAttribute("aria-label") || "";

    // If we see a "Stop" button, we are definitely busy
    const isStopButton =
      testId.includes("stop") || ariaLabel.toLowerCase().includes("stop");

    // If the Send button exists but is disabled (and not empty input), we are busy
    const isDisabledSend = testId.includes("send") && isDisabled;

    if (isStopButton || isDisabledSend) {
      // We are BUSY. But are we Thinking or Generating?
      // We defer to Layer 2 (checkTextGrowth) to decide the nuance.
      // For now, we just know we are not IDLE.
      if (this.status === "IDLE") {
        this.updateStatus("THINKING");
      }
    } else {
      this.updateStatus("IDLE");
    }
  }

  // --- LAYER 2: TEXT PULSE (The "Granularity" Fix) ---

  checkTextGrowth() {
    if (this.status === "IDLE") return;

    // Find the last message (This selector needs to be maintained too)
    const lastMessage = document.querySelector(".markdown-prose:last-of-type");

    if (lastMessage) {
      const currentLength = lastMessage.innerText.length;

      if (currentLength > this.lastTextLength) {
        this.updateStatus("GENERATING"); // Text is streaming -> Blue
      }
      // Note: If length isn't changing, we stay in 'THINKING' (Yellow)

      this.lastTextLength = currentLength;
    }
  }

  updateStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      console.log(`[Synapse] Status: ${newStatus}`);
      this.onStatusChange(newStatus);
    }
  }
}
