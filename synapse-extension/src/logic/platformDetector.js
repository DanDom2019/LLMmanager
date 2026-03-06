// platformDetector.js - Base class for multi-signal detection
export class PlatformDetector {
  constructor(onStatusChange, platformConfig) {
    this.onStatusChange = onStatusChange;
    this.platformConfig = platformConfig;
    this.isGenerating = false;
    this.observer = null;
    this.checkInterval = null;
    this.lastContentLength = 0;
    this._checkCount = 0;
  }

  collectSignals() {
    const { stopSelectors, sendSelectors, loadingIndicatorSelectors } =
      this.platformConfig;

    const signals = {
      stopButton: false,
      sendDisabled: false,
      loadingIndicator: false,
      streaming: false,
      inputLocked: false,
    };

    const debug = this._shouldDebug();
    const tag = `[Synapse:${this.platformConfig.hostname}]`;

    // Check stop buttons
    if (stopSelectors) {
      for (const selector of stopSelectors) {
        const el = this._findVisible(selector);
        if (el) {
          signals.stopButton = true;
          if (debug) console.log(`${tag} ✅ stopButton via "${selector}"`, el);
          break;
        } else {
          if (debug) console.log(`${tag} ❌ stopSelector miss: "${selector}"`);
        }
      }
    }

    // Check send buttons (disabled state)
    if (sendSelectors) {
      for (const selector of sendSelectors) {
        const btn = this._findVisible(selector);
        if (btn) {
          if (debug)
            console.log(
              `${tag} send button found via "${selector}", disabled=${btn.disabled}`,
              btn
            );
          if (btn.disabled) {
            signals.sendDisabled = true;
            break;
          }
        } else {
          if (debug) console.log(`${tag} ❌ sendSelector miss: "${selector}"`);
        }
      }
    }

    // Check loading indicators
    if (loadingIndicatorSelectors) {
      for (const selector of loadingIndicatorSelectors) {
        const el = this._findVisible(selector);
        if (el) {
          signals.loadingIndicator = true;
          if (debug)
            console.log(`${tag} ✅ loadingIndicator via "${selector}"`, el);
          break;
        } else {
          if (debug)
            console.log(
              `${tag} ❌ loadingIndicatorSelector miss: "${selector}"`
            );
        }
      }
    }

    return signals;
  }

  checkState() {
    this._checkCount++;
    const signals = this.collectSignals();
    const newState =
      signals.stopButton ||
      signals.sendDisabled ||
      signals.loadingIndicator ||
      signals.streaming ||
      signals.inputLocked;

    const tag = `[Synapse:${this.platformConfig.hostname}]`;

    if (this._shouldDebug()) {
      console.groupCollapsed(
        `${tag} checkState #${this._checkCount} → generating=${newState}`
      );
      console.table(signals);
      console.groupEnd();
    }

    if (newState !== this.isGenerating) {
      console.log(
        `${tag} 🔄 STATE CHANGE: ${this.isGenerating} → ${newState}`,
        signals
      );
      this.isGenerating = newState;
      this.onStatusChange(newState);
    }
  }

  // Log every 10th periodic check (~5s) to avoid console flooding
  _shouldDebug() {
    return this._checkCount % 10 === 1;
  }

  _findVisible(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (el.offsetWidth > 0 && el.offsetHeight > 0) return el;
      }
    } catch (e) {
      console.warn(`[Synapse] Invalid selector: "${selector}"`, e);
    }
    return null;
  }

  _findElement(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) {
      console.warn(`[Synapse] Invalid selector: "${selector}"`, e);
      return null;
    }
  }

  start() {
    console.log(
      `[Synapse Detector] Starting ${this.constructor.name} for ${this.platformConfig.hostname}...`
    );
    console.log("[Synapse] Platform config:", this.platformConfig);

    this.checkState();

    this.checkInterval = setInterval(() => this.checkState(), 500);

    this.observer = new MutationObserver(() => this.checkState());
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "disabled",
        "aria-label",
        "aria-busy",
        "aria-disabled",
        "contenteditable",
        "data-testid",
        "class",
      ],
    });
  }

  stop() {
    console.log(
      `[Synapse Detector] Stopping ${this.constructor.name} for ${this.platformConfig.hostname}...`
    );

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
