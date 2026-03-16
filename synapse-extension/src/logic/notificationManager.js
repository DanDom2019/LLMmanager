// Synthesizes a short bell-like ding using the Web Audio API.
// Returns a Promise so _playSound can catch async failures.
async function playSynthDing(volume) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Resume context if browser suspended it due to no prior user gesture
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Descending pitch: C6 → C5 over 0.3s, then fade out
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(1047, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(523, ctx.currentTime + 0.3);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.8);

  // Free AudioContext resources after sound finishes
  oscillator.onended = () => ctx.close();
}

// Maps sound keys to player functions.
// Add new entries here to support additional sounds in future versions.
const SOUND_CATALOG = {
  ding: (volume) => playSynthDing(volume),
  // "soft-chime": (volume) => playSynthDing(volume), // placeholder for future sound
};

class NotificationManager {
  constructor() {
    this._toastCallback = null;
  }

  // App.jsx calls this once to register the React state setter for toasts
  onToastRequest(callback) {
    this._toastCallback = callback;
  }

  // Main entry point — called on every true → false transition in App.jsx
  notify(hostname, settings, { tabVisible }) {
    if (!settings) return;
    const { sound, popup } = settings;

    const soundEnabled =
      sound.enabled && (sound.perPlatform[hostname]?.enabled ?? true);
    if (soundEnabled) {
      this._playSound(sound.selectedSound, sound.volume);
    }

    const popupEnabled =
      popup.enabled && (popup.perPlatform[hostname]?.enabled ?? true);
    if (popupEnabled) {
      if (tabVisible) {
        this._requestToast(popup.durationMs);
      } else {
        this._sendSystemNotification(hostname);
      }
    }
  }

  _playSound(soundKey, volume) {
    try {
      const player = SOUND_CATALOG[soundKey];
      if (!player) {
        console.warn(`[Synapse] Unknown sound key: "${soundKey}"`);
        return;
      }
      const result = player(volume);
      // Handle async player functions (e.g. playSynthDing)
      if (result instanceof Promise) {
        result.catch((err) => {
          if (err.name !== "NotAllowedError") {
            console.warn("[Synapse] Audio playback error:", err);
          }
          // NotAllowedError = browser blocked autoplay — fail silently
        });
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.warn("[Synapse] Audio playback error:", err);
      }
    }
  }

  _requestToast(durationMs) {
    if (this._toastCallback) {
      this._toastCallback(durationMs);
    }
  }

  _sendSystemNotification(hostname) {
    const platform = hostname.split(".")[0];
    const title =
      platform.charAt(0).toUpperCase() + platform.slice(1) + " finished";
    chrome.runtime
      .sendMessage({ type: "NOTIFY", title, body: "Your response is ready." })
      .catch((err) => {
        console.warn("[Synapse] Failed to send system notification:", err);
      });
  }
}

// Singleton — import this instance directly, no useRef needed
export const notificationManager = new NotificationManager();
