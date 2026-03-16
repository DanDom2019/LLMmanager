// popup.js - Debug panel for Synapse extension (vanilla JS, no framework)

const SIGNAL_LABELS = {
  stopButton: "Stop button visible",
  sendDisabled: "Send button disabled",
  loadingIndicator: "Loading indicator",
  streaming: "Streaming / text growth",
  inputLocked: "Input locked",
};

const POLL_INTERVAL_MS = 500;

let pollTimer = null;

function el(id) {
  return document.getElementById(id);
}

function renderStatus(state) {
  if (!state) {
    el("platform").textContent = "Not a supported platform";
    el("status-badge").textContent = "—";
    el("status-badge").className = "badge badge-idle";
    el("signals-list").innerHTML =
      '<li class="no-data">No signal data — open a supported AI platform first</li>';
    el("config-source").textContent = "—";
    el("config-version").textContent = "—";
    el("updated-at").textContent = "—";
    return;
  }

  // Platform
  el("platform").textContent = state.platform || "Unknown";

  // Status badge
  const badge = el("status-badge");
  if (state.isGenerating === true) {
    badge.textContent = "Processing";
    badge.className = "badge badge-processing";
  } else if (state.isGenerating === false) {
    badge.textContent = "Done";
    badge.className = "badge badge-done";
  } else {
    badge.textContent = "Idle";
    badge.className = "badge badge-idle";
  }

  // Signals
  const signals = state.signals;
  const list = el("signals-list");
  if (!signals) {
    list.innerHTML = '<li class="no-data">No signal data yet</li>';
  } else {
    list.innerHTML = Object.entries(SIGNAL_LABELS)
      .map(([key, label]) => {
        const fired = !!signals[key];
        return `<li class="signal-row ${fired ? "signal-fired" : "signal-off"}">
          <span class="signal-dot">${fired ? "●" : "○"}</span>
          <span class="signal-name">${label}</span>
          <span class="signal-key">${key}</span>
        </li>`;
      })
      .join("");
  }

  // Config info
  const sourceLabels = {
    remote: "Remote (live)",
    cache: "Cache (stored)",
    bundled: "Bundled fallback",
  };
  el("config-source").textContent =
    sourceLabels[state.configSource] || state.configSource || "—";
  el("config-version").textContent = state.configVersion || "—";

  // Timestamp
  const age = state.updatedAt
    ? Math.round((Date.now() - state.updatedAt) / 100) / 10
    : null;
  el("updated-at").textContent =
    age !== null ? `${age}s ago` : "—";
}

function poll() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) {
      renderStatus(null);
      return;
    }

    chrome.runtime.sendMessage({ type: "GET_TAB_STATE", tabId }, (response) => {
      if (chrome.runtime.lastError) {
        // SW may be sleeping; show stale UI rather than crashing
        return;
      }
      renderStatus(response?.state ?? null);
    });
  });
}

// Start polling when popup opens
poll();
pollTimer = setInterval(poll, POLL_INTERVAL_MS);

// Stop polling when popup is closed (unload fires on popup close)
window.addEventListener("unload", () => clearInterval(pollTimer));
