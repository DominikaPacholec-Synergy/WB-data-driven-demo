import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Order matters: the SDK sheet defines every --ax-* token, our aliases read
// them, and our rules must land last so they win in the unlayered cascade.
import "@workflowbuilder/sdk/style.css";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/components.css";
import "./styles/views.css";
import "./styles/studio.css";

import "./wb/i18n";

import App from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
