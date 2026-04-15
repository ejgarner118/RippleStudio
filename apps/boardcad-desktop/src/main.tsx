import React from "react";
import ReactDOM from "react-dom/client";
import { SiteRoot } from "./SiteRoot";
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SiteRoot />
    </ErrorBoundary>
  </React.StrictMode>,
);
