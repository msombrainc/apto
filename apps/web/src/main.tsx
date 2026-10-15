import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ThemeProvider } from "./theme";
import "./styles.css";

try {
  const stored = localStorage.getItem("apto-aims-theme");
  document.documentElement.dataset.theme =
    stored === "light" ? "light" : "dark";
} catch {
  document.documentElement.dataset.theme = "dark";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
