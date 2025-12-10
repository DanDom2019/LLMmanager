import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// 1. Create a container element
const rootElement = document.createElement("div");
rootElement.id = "synapse-extension-root";
document.body.appendChild(rootElement);

// 2. Create a Shadow DOM (Isolated style environment)
const shadowRoot = rootElement.attachShadow({ mode: "open" });

// 3. Inject our Styles into the Shadow DOM
// (CRXJS handles CSS injection differently, but for now we manually link it)
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

// 4. Mount the React App inside the Shadow DOM
const root = ReactDOM.createRoot(shadowRoot);
root.render(
  <React.StrictMode>
    <div className="synapse-container">
      <App />
    </div>
  </React.StrictMode>
);
