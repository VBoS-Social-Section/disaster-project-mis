/**
 * Resilience Explorer (Vanuatu) reference palette — mirrors `src/index.css` `--re-*` tokens.
 * Prefer CSS variables (`var(--re-blue)`, etc.) in UI; use this for canvas/SVG, tests, or docs.
 */
export const resiliencePalette = {
  /** Deep navy — left nav (always dark) */
  navy: "#0d2b45",
  /** Primary action / links / focus */
  blue: "#1a73e8",
  /** Page background */
  bgApp: "#f4f7f9",
  /** Section / tool bar (e.g. scenario controls) */
  bgSection: "#cad6e2",
  border: "#d1d9e0",
  text: "#1a1a1a",
  textMuted: "#5f7d95",
  /** Note / callout */
  noteBg: "#fff9e6",
  noteBorder: "#ffb347",
  /** Sidebar active row (on navy) */
  sidebarActive: "#163d5e",
} as const;

export type ResiliencePalette = typeof resiliencePalette;
