import { StrictMode } from "react";
import "@fontsource-variable/work-sans/index.css";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import Providers from "./Providers.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
);
