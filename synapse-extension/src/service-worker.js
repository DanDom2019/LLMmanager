// Service Worker for Synapse Extension
console.log("Synapse service worker loaded");

// Track active AI sessions across tabs
const activeSessions = new Map();

// Per-tab debug state for the popup (platform, signals, config info)
const tabState = new Map();

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Synapse extension installed");
  chrome.storage.local.set({ sessionHistory: [] });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[SW] Message received:", message);

  switch (message.type) {
    case "PING":
      sendResponse({ status: "PONG" });
      break;

    case "STATUS_UPDATE":
      handleStatusUpdate(message, sender);
      sendResponse({ success: true });
      break;

    case "GET_ALL_SESSIONS":
      sendResponse({ sessions: Array.from(activeSessions.entries()) });
      break;

    case "GET_TAB_STATE": {
      const state = tabState.get(message.tabId) || null;
      sendResponse({ state });
      break;
    }

    case "NOTIFY":
      showNotification(message.title, message.body);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }

  return true; // Keep message channel open for async responses
});

// Handle status updates from content scripts
function handleStatusUpdate(message, sender) {
  const tabId = sender.tab?.id;
  if (!tabId) return;

  const { platform, isGenerating, signals, configSource, configVersion } = message;

  // Store debug state for the popup
  tabState.set(tabId, {
    platform,
    isGenerating,
    signals: signals || null,
    configSource: configSource || "bundled",
    configVersion: configVersion || "unknown",
    updatedAt: Date.now(),
  });

  // Legacy session tracking (preserving existing behaviour)
  if (isGenerating === true && !activeSessions.has(tabId)) {
    activeSessions.set(tabId, {
      platform,
      startTime: Date.now(),
      url: sender.tab.url,
    });
  } else if (isGenerating === false) {
    const session = activeSessions.get(tabId);
    if (session) {
      const duration = Date.now() - session.startTime;
      console.log(
        `[SW] ${platform} completed in ${Math.round(duration / 1000)}s`,
      );
      saveToHistory({ ...session, duration, endTime: Date.now() });
      activeSessions.delete(tabId);
    }
  }
}

// Save session to history
function saveToHistory(session) {
  chrome.storage.local.get(["sessionHistory"], (result) => {
    const history = result.sessionHistory || [];
    history.unshift(session);

    // Keep only last 50 sessions
    if (history.length > 50) {
      history.splice(50);
    }

    chrome.storage.local.set({ sessionHistory: history });
  });
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon-128.png"),
    title: title,
    message: message,
    priority: 1,
  });
}

// Clean up when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeSessions.has(tabId)) {
    console.log(`[SW] Tab ${tabId} closed, cleaning up session`);
    activeSessions.delete(tabId);
  }
  tabState.delete(tabId);
});
