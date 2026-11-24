/** Sign-in session limits. Keep in sync with AUTH_*_TIMEOUT_SECONDS on the backend. */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;

export type ExpiryReason = "idle" | "absolute";

export const EXPIRY_MESSAGES: Record<ExpiryReason, string> = {
  idle: "You were signed out after 30 minutes of inactivity.",
  absolute: "Your session reached its 8 hour limit. Please sign in again.",
};

/** Returns why the session has ended, or null if it is still valid. */
export function getExpiry(
  now: number,
  loginAt: number | null,
  lastActive: number | null,
): ExpiryReason | null {
  // Sessions saved before these limits existed have no timestamps: treat as expired.
  if (loginAt == null || lastActive == null) return "absolute";
  if (now - loginAt > ABSOLUTE_TIMEOUT_MS) return "absolute";
  if (now - lastActive > IDLE_TIMEOUT_MS) return "idle";
  return null;
}
