import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConfigManager } from "./logic/configManager";
import { ChatGPTDetector } from "./logic/detector";

const configManager = new ConfigManager();

async function bootstrap() {
  await configManager.init();

  const platformConfig = configManager.getPlatformConfig();
  if (!platformConfig) {
    console.log("[Synapse] Not a supported platform, skipping.");
    return;
  }

  console.log("[Synapse] Platform detected:", platformConfig.hostname);

  // 1. Create a container element
  const rootElement = document.createElement("div");
  rootElement.id = "synapse-extension-root";
  document.body.appendChild(rootElement);

  // 2. Create a Shadow DOM (Isolated style environment)
  const shadowRoot = rootElement.attachShadow({ mode: "open" });

  // 3. Inject our Styles into the Shadow DOM
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    /* Minimal reset for our component */
    :host { all: initial; }
    .synapse-container {
      font-family: sans-serif;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
    }
  `;
  shadowRoot.appendChild(styleTag);

  // 4. Mount the React App inside the Shadow DOM with platformConfig
  const root = ReactDOM.createRoot(shadowRoot);
  root.render(
    <React.StrictMode>
      <div className="synapse-container">
        <App platformConfig={platformConfig} />
      </div>
    </React.StrictMode>,
  );
}

bootstrap();
