// geminiDetector.js - Gemini-specific detection using aria/role attributes only (no class names)
import { PlatformDetector } from "./platformDetector";

const TAG = "[Synapse:Gemini]";

export class GeminiDetector extends PlatformDetector {
  constructor(onStatusChange, platformConfig) {
    super(onStatusChange, platformConfig);
    this.lastStreamingLength = 0;
  }

  collectSignals() {
    const baseSignals = super.collectSignals();
    const debug = this._shouldDebug();

    // ── Signal: Material Design progress indicators ──────────────────────────
    // Gemini uses Angular Material — class names are hashed, so use tag/role only
    const progressSelectors = [
      '[role="progressbar"]',
      'mat-progress-bar',
      'mat-spinner',
      '[aria-label*="Loading"]',
      '[aria-label*="loading"]',
      '[aria-label*="Generating"]',
      '[aria-label*="generating"]',
    ];
    for (const sel of progressSelectors) {
      const el = document.querySelector(sel);
      if (el && this._isVisible(el)) {
        baseSignals.loadingIndicator = true;
        if (debug)
          console.log(
            `${TAG} ✅ progress indicator via "${sel}"`,
            el.tagName,
            el.getAttribute("aria-label") || ""
          );
        break;
      }
      if (debug) console.log(`${TAG} ❌ progress miss: "${sel}"`);
    }

    // ── Signal: aria-busy on any container ───────────────────────────────────
    const busyEl = document.querySelector('[aria-busy="true"]');
    if (busyEl) {
      baseSignals.loadingIndicator = true;
      if (debug)
        console.log(
          `${TAG} ✅ aria-busy="true"`,
          busyEl.tagName,
          busyEl.getAttribute("aria-label") || ""
        );
    } else {
      if (debug) console.log(`${TAG} ❌ no [aria-busy="true"]`);
    }

    // ── Signal: text growth in last model response ────────────────────────────
    // Gemini Angular elements — use tag names and role/data attributes, never class
    const responseSelectors = [
      'model-response',                      // custom Angular element
      '[data-message-author="model"]',       // data attribute
      '[role="article"]',                    // ARIA landmark
      'response-element',                    // another Angular element name
    ];

    let lastResponse = null;
    for (const sel of responseSelectors) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length > 0) {
        lastResponse = nodes[nodes.length - 1];
        if (debug)
          console.log(
            `${TAG} response container found via "${sel}" (${nodes.length} nodes)`
          );
        break;
      }
      if (debug) console.log(`${TAG} ❌ response container miss: "${sel}"`);
    }

    if (lastResponse) {
      const currentLength = lastResponse.textContent?.length || 0;
      const growth = currentLength - this.lastStreamingLength;
      if (debug)
        console.log(
          `${TAG} text growth: ${this.lastStreamingLength} → ${currentLength} (Δ${growth})`
        );
      if (growth > 5 && currentLength > 0) {
        baseSignals.streaming = true;
        if (debug) console.log(`${TAG} ✅ streaming via text growth`);
      }
      this.lastStreamingLength = currentLength;
    } else {
      if (debug)
        console.log(`${TAG} ❌ no response container for text-growth check`);
    }

    // ── Signal: send button absent but stop button present ───────────────────
    // Gemini swaps the send button for a stop button during generation
    const sendButtonSelectors = [
      'button[aria-label="Send message"]',
      'button[aria-label="Submit"]',
      'button[mattooltip="Send message"]',
    ];
    const stopButtonSelectors = [
      'button[aria-label="Stop response"]',
      'button[aria-label="Stop generating"]',
      'button[aria-label="Stop"]',
    ];

    let sendBtn = null;
    for (const sel of sendButtonSelectors) {
      sendBtn = document.querySelector(sel);
      if (sendBtn) {
        if (debug)
          console.log(`${TAG} send button found via "${sel}"`, sendBtn);
        break;
      }
      if (debug) console.log(`${TAG} ❌ send button miss: "${sel}"`);
    }

    if (!sendBtn) {
      if (debug)
        console.log(`${TAG} send button absent — checking for stop button`);
      for (const sel of stopButtonSelectors) {
        const stopBtn = document.querySelector(sel);
        if (stopBtn && this._isVisible(stopBtn)) {
          baseSignals.inputLocked = true;
          if (debug)
            console.log(
              `${TAG} ✅ inputLocked: send absent + stop visible via "${sel}"`,
              stopBtn
            );
          break;
        }
        if (debug) console.log(`${TAG} ❌ stop button miss: "${sel}"`);
      }
    }

    // ── Signal: aria-live polite region updating (streaming output) ───────────
    // Gemini uses aria-live regions to announce streaming text
    const liveRegionSelectors = [
      '[aria-live="polite"]',
      '[aria-live="assertive"]',
    ];
    for (const sel of liveRegionSelectors) {
      const el = document.querySelector(sel);
      if (el && this._isVisible(el) && (el.textContent?.length || 0) > 0) {
        if (debug)
          console.log(
            `${TAG} aria-live region found via "${sel}", length=${el.textContent.length}`
          );
        // Only flag as streaming if content is actively changing (handled by text-growth above)
        break;
      }
      if (debug) console.log(`${TAG} ❌ aria-live miss: "${sel}"`);
    }

    // ── Signal: Angular loading/pending data attributes ───────────────────────
    const angularLoadingSelectors = [
      '[data-pending="true"]',
      '[data-loading="true"]',
      '[loading]',   // Angular attribute binding shorthand
    ];
    for (const sel of angularLoadingSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        baseSignals.loadingIndicator = true;
        if (debug)
          console.log(`${TAG} ✅ Angular loading attr via "${sel}"`, el);
        break;
      }
      if (debug) console.log(`${TAG} ❌ Angular loading attr miss: "${sel}"`);
    }

    if (debug)
      console.log(`${TAG} final signals:`, { ...baseSignals });

    return baseSignals;
  }

  _isVisible(el) {
    return el && el.offsetWidth > 0 && el.offsetHeight > 0;
  }
}
