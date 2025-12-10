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
