/**
 * Minimal header: logo + title | avatar, theme toggle.
 * Sticky with glass blur + shadow on scroll. Inter/SF Pro typography.
 */
import { useState, useCallback, useEffect } from "react";
import { HelpOverlay } from "@/components/HelpOverlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ColorModeButton } from "@/components/ui/color-mode";
import {
  LuCircleHelp,
  LuLockKeyhole,
  LuLock,
  LuLogOut,
  LuSettings,
  LuShare2,
  LuUser,
  LuCopy,
  LuCheck,
  LuShield,
  LuLeaf,
  LuClipboardList,
} from "react-icons/lu";
import { ClimateModuleSelect } from "./LeftSidebar/ClimateModuleSelect";
import { useAuthStore } from "@/store/auth-store";
import { useViewStore } from "@/store/view-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useLockStore } from "@/store/lock-store";
import { useUiStore } from "@/store/ui-store";
import { toast } from "@/utils/toast";
import { cn } from "@/lib/utils";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";
function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export const Header = () => {
  const [shareDialogIsOpen, setShareDialogIsOpen] = useState(false);
  const [helpOverlayOpen, setHelpOverlayOpen] = useState(false);
  const setProfilePageOpen = useUiStore((s) => s.setProfilePageOpen);
  const setDataEntryPageOpen = useUiStore((s) => s.setDataEntryPageOpen);
  const [scrolled, setScrolled] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const { scenarioId, setScenario } = useViewStore();
  const setComparisonMode = useComparisonStore((s) => s.setComparisonMode);
  const { lock, pinHash, resetLockOnLogout } = useLockStore();

  const handleLogout = () => {
    resetLockOnLogout();
    clearAuth();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY ?? document.documentElement.scrollTop;
      setScrolled(scrollTop > 4);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-14 min-h-14 min-w-0 items-center gap-4 overflow-hidden px-4 transition-shadow duration-200",
        "border-b border-border glass-surface-strong",
        "shadow-[0_1px_0_0_var(--border)]",
        scrolled && "shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.25)]",
      )}
    >
      {/* Left: Logo + Title */}
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <img
          src="/DRMISLogo.svg"
          alt="DRMIS Logo"
          className="size-8 shrink-0"
        />
        <div className="flex min-w-0 flex-col gap-0">
          <h1
            className="font-sans text-sm font-bold tracking-tight text-foreground"
            title="Disaster Risk Management Information System"
          >
            DRMIS
          </h1>
          <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:inline">
            Disaster Risk Management Information System
          </span>
        </div>
      </div>

      {/* Center: View mode toggle + Climate module dropdown when in Climate mode */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          data-tour="view-mode"
          className="flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-muted/50 p-0.5 md:gap-1"
          role="tablist"
          aria-label="View mode"
        >
        <Button
          variant={scenarioId === "disaster" ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-9 w-9 gap-1.5 px-2 md:h-7 md:w-auto md:px-2.5",
            "text-xs transition-all duration-200",
            scenarioId === "disaster" && "ring-1 ring-primary/30",
          )}
          onClick={() => {
            setScenario("disaster");
            setComparisonMode(false);
          }}
          title="Disaster & preparedness"
          role="tab"
          aria-selected={scenarioId === "disaster"}
          aria-current={scenarioId === "disaster" ? "page" : undefined}
        >
          <LuShield className="size-4 md:size-3.5" />
          <span className="hidden md:inline">Disaster</span>
        </Button>
        <Button
          variant={scenarioId === "climate" ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-9 w-9 gap-1.5 px-2 md:h-7 md:w-auto md:px-2.5",
            "text-xs transition-all duration-200",
            scenarioId === "climate" && "ring-1 ring-primary/30",
          )}
          onClick={() => setScenario("climate")}
          title="Climate change: land cover, raster maps, year comparison"
          role="tab"
          aria-selected={scenarioId === "climate"}
          aria-current={scenarioId === "climate" ? "page" : undefined}
        >
          <LuLeaf className="size-4 md:size-3.5" />
          <span className="hidden md:inline">Climate</span>
        </Button>
        </div>
        {scenarioId === "climate" && (
          <div className="hidden sm:block">
            <ClimateModuleSelect compact />
          </div>
        )}
      </div>

      {/* Right: Theme, Avatar - 44px touch targets on mobile */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <ColorModeButton
          aria-label="Toggle light/dark theme"
          className="min-h-11 min-w-11 md:min-h-0 md:min-w-0"
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="min-h-11 min-w-11 rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-11 md:size-8 inline-flex items-center justify-center overflow-hidden shrink-0 touch-manipulation"
            aria-label="Open menu"
          >
            {avatarUrl(user?.avatar) ? (
              <img
                src={avatarUrl(user?.avatar)!}
                alt=""
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                <LuUser className="size-4 icon-interactive" />
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              {user?.username}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setHelpOverlayOpen(true)}>
              <LuCircleHelp className="size-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDataEntryPageOpen(true)}>
              <LuClipboardList className="size-4" />
              Data Entry
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setProfilePageOpen(true)}>
              <LuSettings className="size-4" />
              Profile & security
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShareDialogIsOpen(true)}>
              <LuShare2 className="size-4" />
              Share
            </DropdownMenuItem>
            {pinHash && (
              <DropdownMenuItem onSelect={() => lock()}>
                <LuLock className="size-4" />
                Lock screen
              </DropdownMenuItem>
            )}
            {user?.is_staff && (
              <DropdownMenuItem asChild>
                <a
                  href={`${import.meta.env.VITE_API_HOST ?? ""}/admin/`}
                  className="flex items-center gap-2 text-inherit no-underline"
                >
                  <LuLockKeyhole className="size-4" />
                  Admin
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LuLogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShareDialog
        isOpen={shareDialogIsOpen}
        setIsOpen={setShareDialogIsOpen}
      />
      <HelpOverlay open={helpOverlayOpen} onOpenChange={setHelpOverlayOpen} />
    </header>
  );
};

type ShareDialogProps = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

function ShareDialog({ isOpen, setIsOpen }: ShareDialogProps) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [url]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => setIsOpen(o)}>
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Copy the link below to share the current view with others.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 overflow-x-auto break-all rounded-md border border-border bg-muted p-2 text-sm">
          {url}
        </div>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <LuCheck className="size-4" />
                Copied
              </>
            ) : (
              <>
                <LuCopy className="size-4" />
                Copy Link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
