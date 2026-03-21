import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { LuUser } from "react-icons/lu";
import { colors } from "@/tokens";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";

function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export interface UserAvatarProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Circular user avatar — image from auth store or fallback glyph.
 */
export function UserAvatar({ className, onClick }: UserAvatarProps) {
  const user = useAuthStore((s) => s.user);
  const url = avatarUrl(user?.avatar);
  const initial = user?.username?.charAt(0)?.toUpperCase();

  const content = url ? (
    <img src={url} alt="" className="size-full object-cover" />
  ) : initial ? (
    <span
      className="flex size-full items-center justify-center text-xs font-semibold"
      style={{
        color: colors.accent.blue,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {initial}
    </span>
  ) : (
    <span className="flex size-full items-center justify-center">
      <LuUser className="size-4" style={{ color: colors.text.muted }} />
    </span>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-8 shrink-0 overflow-hidden rounded-full border transition-opacity hover:opacity-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]",
        className,
      )}
      style={{
        backgroundColor: colors.bg.elevated,
        borderColor: colors.border.strong,
      }}
      aria-label={user?.username ? `Account: ${user.username}` : "Account"}
    >
      {content}
    </button>
  );
}
