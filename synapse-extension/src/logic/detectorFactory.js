// detectorFactory.js - Factory to create the appropriate detector based on platform
import { PlatformDetector } from "./platformDetector";
import { ChatGPTDetector } from "./chatgptDetector";
import { ClaudeDetector } from "./claudeDetector";
import { GeminiDetector } from "./geminiDetector";

const DETECTOR_MAP = {
  "chatgpt.com": ChatGPTDetector,
  "claude.ai": ClaudeDetector,
  "gemini.google.com": GeminiDetector,
};

export function createDetector(onStatusChange, platformConfig) {
  const DetectorClass =
    DETECTOR_MAP[platformConfig.hostname] || PlatformDetector;

  console.log(
    `[Synapse] Creating ${DetectorClass.name} for ${platformConfig.hostname}`
  );

  return new DetectorClass(onStatusChange, platformConfig);
}
