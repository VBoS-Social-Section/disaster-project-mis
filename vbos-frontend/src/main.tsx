import { StrictMode } from "react";
import "@fontsource-variable/work-sans/index.css";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import Providers from "./Providers.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
        <Toaster richColors position="top-right" closeButton />
      </Providers>
    </ErrorBoundary>
  </StrictMode>
);
