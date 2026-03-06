// claudeDetector.js - Claude-specific detection using aria-label and contenteditable
import { PlatformDetector } from "./platformDetector";

const TAG = "[Synapse:Claude]";

export class ClaudeDetector extends PlatformDetector {
  constructor(onStatusChange, platformConfig) {
    super(onStatusChange, platformConfig);
    this.lastStreamingLength = 0;
  }

  collectSignals() {
    const baseSignals = super.collectSignals();
    const debug = this._shouldDebug();

    // ── Signal: aria-busy on any container ───────────────────────────────────
    const busyContainer = document.querySelector('[aria-busy="true"]');
    if (busyContainer) {
      baseSignals.loadingIndicator = true;
      if (debug)
        console.log(
          `${TAG} ✅ aria-busy="true" found`,
          busyContainer.tagName,
          busyContainer.getAttribute("aria-label") || ""
        );
    } else {
      if (debug) console.log(`${TAG} ❌ no [aria-busy="true"] found`);
    }

    // ── Signal: data-is-streaming attribute ──────────────────────────────────
    const streamingEl = document.querySelector('[data-is-streaming="true"]');
    if (streamingEl) {
      baseSignals.streaming = true;
      if (debug)
        console.log(`${TAG} ✅ [data-is-streaming="true"] found`, streamingEl);
    } else {
      if (debug)
        console.log(`${TAG} ❌ no [data-is-streaming="true"] element`);
    }

    // ── Signal: text growth in last message ──────────────────────────────────
    // Claude message containers — attribute-only selectors, no hashed classes
    const messageSelectors = [
      '[data-is-streaming]',            // any streaming state
      '[data-test-render-count]',       // internal render counter Claude uses
      'div[class*="prose"]',            // prose wrapper (class name fragment)
    ];

    let lastMessage = null;
    for (const sel of messageSelectors) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length > 0) {
        lastMessage = nodes[nodes.length - 1];
        if (debug)
          console.log(
            `${TAG} response container found via "${sel}" (${nodes.length} nodes)`
          );
        break;
      }
      if (debug)
        console.log(`${TAG} ❌ response container miss: "${sel}"`);
    }

    if (lastMessage) {
      const currentLength = lastMessage.innerText?.length || 0;
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
      if (debug) console.log(`${TAG} ❌ no response container found for text-growth check`);
    }

    // ── Signal: contenteditable input locked ─────────────────────────────────
    // Claude's composer is a contenteditable div — read with innerText, not .value
    const inputSelectors = [
      'div[contenteditable="true"]',
      '[data-placeholder]',
      '[aria-label*="Message"]',
      '[aria-label*="Reply"]',
    ];

    let inputField = null;
    for (const sel of inputSelectors) {
      inputField = document.querySelector(sel);
      if (inputField) {
        if (debug)
          console.log(
            `${TAG} input found via "${sel}", contenteditable=${inputField.getAttribute("contenteditable")}, aria-disabled=${inputField.getAttribute("aria-disabled")}`,
            inputField
          );
        break;
      }
      if (debug) console.log(`${TAG} ❌ input miss: "${sel}"`);
    }

    if (inputField) {
      const ariaDisabled = inputField.getAttribute("aria-disabled") === "true";
      const ceDisabled = inputField.getAttribute("contenteditable") === "false";
      const ptrEvents = getComputedStyle(inputField).pointerEvents === "none";

      if (debug)
        console.log(
          `${TAG} input locked checks: aria-disabled=${ariaDisabled}, contenteditable=false=${ceDisabled}, pointer-events=none=${ptrEvents}`
        );

      if (ariaDisabled || ceDisabled || ptrEvents) {
        baseSignals.inputLocked = true;
        if (debug) console.log(`${TAG} ✅ inputLocked`);
      }
    } else {
      if (debug) console.log(`${TAG} ❌ no input field found`);
    }

    // ── Signal: typing / thinking indicator ─────────────────────────────────
    const thinkingSelectors = [
      '[aria-label*="typing"]',
      '[aria-label*="Thinking"]',
      '[aria-label*="thinking"]',
    ];
    for (const sel of thinkingSelectors) {
      const el = document.querySelector(sel);
      if (el && this._isVisible(el)) {
        baseSignals.loadingIndicator = true;
        if (debug)
          console.log(`${TAG} ✅ thinking/typing indicator via "${sel}"`, el);
        break;
      }
      if (debug) console.log(`${TAG} ❌ thinking/typing miss: "${sel}"`);
    }

    if (debug)
      console.log(`${TAG} final signals:`, { ...baseSignals });

    return baseSignals;
  }

  _isVisible(el) {
    return el && el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  getInputText() {
    const inputField = document.querySelector('div[contenteditable="true"]');
    return inputField ? inputField.innerText : "";
  }
}
