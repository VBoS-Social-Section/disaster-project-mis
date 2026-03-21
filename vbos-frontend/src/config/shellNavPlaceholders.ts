export interface ShellNavPlaceholder {
  /** Toast title — feature name (not “Coming soon”). */
  title: string;
  /** What this area will do for users. */
  line: string;
  /** Rough ETA / phase from TASKS.md so duty officers know it’s planned. */
  eta: string;
}

export const SHELL_NAV_PLACEHOLDERS: Record<string, ShellNavPlaceholder> = {
  datasets: {
    title: "Datasets",
    line: "Browse and manage registered datasets in one place—search, filter, and inspect layers without leaving the MIS.",
    eta: "ETA: Phase B — dataset catalog & approval workflow (TASKS.md).",
  },
  exports: {
    title: "Exports",
    line: "Request bulk downloads (XLSX, PDF, GeoPackage) and track long-running jobs from the app instead of ad hoc admin exports.",
    eta: "ETA: Phase A — Celery-backed async exports once the job queue lands.",
  },
  audit: {
    title: "Audit log",
    line: "Review who changed what, with field-level before/after values and exportable reports for compliance.",
    eta: "ETA: Phase A — field-level audit logging (~10% in TASKS.md).",
  },
  settings: {
    title: "Settings",
    line: "Manage profile, notifications, MFA, and org preferences in one screen—aligned with the security roadmap.",
    eta: "ETA: Phase A–B — MFA enforcement first; SSO (OAuth) in Phase B.",
  },
};

export function getShellNavPlaceholder(id: string): ShellNavPlaceholder | undefined {
  return SHELL_NAV_PLACEHOLDERS[id];
}
