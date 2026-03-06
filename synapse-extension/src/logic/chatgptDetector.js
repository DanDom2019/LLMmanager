// chatgptDetector.js - ChatGPT-specific detection using data-testid attributes
import { PlatformDetector } from "./platformDetector";

export class ChatGPTDetector extends PlatformDetector {
  constructor(onStatusChange, platformConfig) {
    super(onStatusChange, platformConfig);
    this.lastStreamingLength = 0;
  }

  collectSignals() {
    const baseSignals = super.collectSignals();

    // ChatGPT-specific: check for result-streaming class
    const streamingContainer = document.querySelector(
      '[data-testid="conversation-turn-stream"], .result-streaming'
    );
    if (streamingContainer) {
      baseSignals.streaming = true;
    }

    // Additional: check for streaming by watching text growth in response
    const responseContainers = document.querySelectorAll(
      '[data-message-id] .markdown, [data-testid="conversation-turn"] .markdown'
    );
    if (responseContainers.length > 0) {
      const lastResponse = responseContainers[responseContainers.length - 1];
      const currentLength = lastResponse.textContent?.length || 0;

      if (currentLength > this.lastStreamingLength && currentLength > 0) {
        const growth = currentLength - this.lastStreamingLength;
        // Significant growth indicates streaming (more than a few chars per check)
        if (growth > 5) {
          baseSignals.streaming = true;
        }
      }
      this.lastStreamingLength = currentLength;
    }

    // Check for thinking/reasoning indicator
    const thinkingIndicator = document.querySelector(
      '[data-testid="thinking-indicator"], .thinking-block'
    );
    if (thinkingIndicator && this._isVisible(thinkingIndicator)) {
      baseSignals.loadingIndicator = true;
    }

    return baseSignals;
  }

  _isVisible(el) {
    return el && el.offsetWidth > 0 && el.offsetHeight > 0;
  }
}
