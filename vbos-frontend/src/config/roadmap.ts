/**
 * Default public TASKS.md on GitHub (upstream DRMIS repo).
 * Override with `VITE_ROADMAP_URL` for forks or a self-hosted roadmap page.
 */
export const DEFAULT_ROADMAP_TASKS_URL =
  "https://github.com/VBoS-Social-Section/disaster-project-mis/blob/main/TASKS.md";

/**
 * Public URL for DRMIS roadmap / TASKS.md (GitHub blob or any HTTPS page).
 * Falls back to {@link DEFAULT_ROADMAP_TASKS_URL} so nav placeholder toasts always have a real link.
 */
export function getRoadmapTasksUrl(): string {
  const v = import.meta.env.VITE_ROADMAP_URL;
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return DEFAULT_ROADMAP_TASKS_URL;
}
