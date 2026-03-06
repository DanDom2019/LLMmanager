// Service Worker for Synapse Extension
console.log("Synapse service worker loaded");

// Track active AI sessions across tabs
const activeSessions = new Map();

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Synapse extension installed");

  // Initialize default settings
  chrome.storage.local.set({
    enableNotifications: true,
    enableSound: false,
    sessionHistory: [],
  });
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

  const { status, platform } = message;

  // Update session tracking
  if (status === "generating") {
    activeSessions.set(tabId, {
      platform,
      startTime: Date.now(),
      url: sender.tab.url,
    });
  } else if (status === "complete") {
    const session = activeSessions.get(tabId);
    if (session) {
      // Calculate duration
      const duration = Date.now() - session.startTime;
      console.log(
        `[SW] ${platform} completed in ${Math.round(duration / 1000)}s`,
      );

      // Save to history
      saveToHistory({ ...session, duration, endTime: Date.now() });

      // Show notification
      chrome.storage.local.get(["enableNotifications"], (result) => {
        if (result.enableNotifications) {
          showNotification(
            `${platform} finished!`,
            `Response completed in ${Math.round(duration / 1000)} seconds`,
          );
        }
      });

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
});
