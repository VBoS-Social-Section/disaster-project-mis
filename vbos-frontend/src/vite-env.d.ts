/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional URL to TASKS.md / roadmap (e.g. GitHub). Shown in shell nav placeholder toasts. */
  readonly VITE_ROADMAP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
