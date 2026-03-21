/**
 * Font stacks — load via Google Fonts in `index.css` / `index.html`.
 * Use **mono** for IDs, dates, metrics, labels, badges.
 */
export const typography = {
  display: {
    family: "'Syne', sans-serif",
    weights: [700, 800] as const,
  },
  body: {
    family: "'DM Sans', sans-serif",
    weights: [300, 400, 500] as const,
  },
  mono: {
    family: "'IBM Plex Mono', monospace",
    weights: [400, 500] as const,
  },
} as const;

/** CSS `font-family` strings (ready for inline styles or CSS vars). */
export const fontFamily = {
  display: typography.display.family,
  body: typography.body.family,
  mono: typography.mono.family,
} as const;

export type Typography = typeof typography;
