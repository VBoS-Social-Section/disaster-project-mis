/**
 * Minimal header: logo + title | avatar, theme toggle.
 * Sticky with glass blur + shadow on scroll. Inter/SF Pro typography.
 */
import { useState, useCallback, useEffect, type ReactNode } from "react";
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
  LuSquareSplitHorizontal,
  LuClipboardList,
  LuGauge,
  LuBookOpen,
  LuMenu,
} from "react-icons/lu";
import { useAuthStore } from "@/store/auth-store";
import { useViewStore } from "@/store/view-store";
import { useModeTransition } from "@/hooks/useModeTransition";
import {
  HEADER_MODE_IDS,
  HEADER_MODE_META,
  isHeaderModeId,
  type HeaderModeId,
} from "@/config/modes";
import { useLockStore } from "@/store/lock-store";
import { useUiStore } from "@/store/ui-store";
import { useSimulationStore } from "@/store/simulation-store";
import { toast } from "@/utils/toast";
import { cn } from "@/lib/utils";

const API_HOST = import.meta.env.VITE_API_HOST ?? "";
function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_HOST.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export type HeaderProps = {
  /** Hide left logo block when the shell topbar already shows DRMIS branding. */
  hideBrand?: boolean;
  /** Use a menu icon instead of avatar trigger (when shell `<UserAvatar />` shows account). */
  hideUserMenu?: boolean;
};

export function Header({ hideBrand = false, hideUserMenu = false }: HeaderProps) {
  const [shareDialogIsOpen, setShareDialogIsOpen] = useState(false);
  const [helpOverlayOpen, setHelpOverlayOpen] = useState(false);
  const setProfilePageOpen = useUiStore((s) => s.setProfilePageOpen);
  const setDataEntryPageOpen = useUiStore((s) => s.setDataEntryPageOpen);
  const [scrolled, setScrolled] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const { switchToMode } = useModeTransition();
  const [modeHelpOpen, setModeHelpOpen] = useState(false);
  const { lock, pinHash, resetLockOnLogout } = useLockStore();
  const { isOpen: simOpen, setIsOpen: setSimOpen } = useSimulationStore();

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

  const headerActiveMode: HeaderModeId | null = isHeaderModeId(scenarioId)
    ? scenarioId
    : null;
  const activeTabIndex = headerActiveMode
    ? HEADER_MODE_IDS.indexOf(headerActiveMode)
    : 0;

  const focusModeTab = useCallback((index: number) => {
    const n = HEADER_MODE_IDS.length;
    const i = ((index % n) + n) % n;
    const id = HEADER_MODE_IDS[i];
    switchToMode(id);
    window.setTimeout(() => {
      document.getElementById(`view-mode-tab-${id}`)?.focus();
    }, 0);
  }, [switchToMode]);

  const modeIcons: Record<HeaderModeId, ReactNode> = {
    disaster: <LuShield className="size-3.5 shrink-0" aria-hidden />,
    climate: <LuLeaf className="size-3.5 shrink-0" aria-hidden />,
    compare: <LuSquareSplitHorizontal className="size-3.5 shrink-0" aria-hidden />,
  };

  const modeActiveClasses: Record<HeaderModeId, string> = {
    disaster:
      "bg-red-500/12 text-red-800 ring-1 ring-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/35",
    climate:
      "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/35",
    compare:
      "bg-violet-500/12 text-violet-900 ring-1 ring-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/35",
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-14 min-h-14 min-w-0 items-center gap-4 overflow-hidden px-4 transition-shadow duration-200",
        "border-b border-border glass-surface-strong",
        "shadow-[0_1px_0_0_var(--border)]",
        scrolled && "shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.25)]",
      )}
    >
      {/* Left: Logo + Title (optional — hidden when AppShell Topbar shows brand) */}
      {!hideBrand ? (
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
      ) : null}

      {/* Center: segmented Disaster | Climate | Compare */}
      <div className="flex min-w-0 flex-1 items-center justify-center px-2">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <div
              data-tour="view-mode"
              className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5 shadow-sm md:gap-0.5"
              role="tablist"
              aria-label="View mode: Disaster, Climate, or Compare"
              id="view-mode-tablist"
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const base = activeTabIndex >= 0 ? activeTabIndex : 0;
                if (e.key === "ArrowRight") focusModeTab(base + 1);
                else focusModeTab(base - 1);
              }}
            >
              {HEADER_MODE_IDS.map((id) => {
                const selected = scenarioId === id;
                const meta = HEADER_MODE_META[id];
                return (
                  <Button
                    key={id}
                    type="button"
                    variant={selected ? "secondary" : "ghost"}
                    size="sm"
                    id={`view-mode-tab-${id}`}
                    role="tab"
                    aria-selected={selected}
                    aria-controls="drmis-mode-panel"
                    tabIndex={selected ? 0 : -1}
                    className={cn(
                      "h-9 gap-1 px-2 text-xs font-semibold transition-all duration-200 md:h-8 md:px-2.5",
                      selected && modeActiveClasses[id],
                      !selected && "text-muted-foreground",
                    )}
                    title={`${meta.label}: ${meta.subtitle}`}
                    onClick={() => switchToMode(id)}
                  >
                    <span className="flex items-center gap-1.5">
                      {modeIcons[id]}
                      <span className="hidden sm:inline">{meta.label}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              aria-label="What do Disaster, Climate, and Compare show?"
              onClick={() => setModeHelpOpen(true)}
            >
              <LuCircleHelp className="size-4" />
            </Button>
          </div>
          {headerActiveMode ? (
            <p
              className="hidden max-w-[20rem] text-center text-[10px] leading-tight text-muted-foreground md:block"
              aria-live="polite"
            >
              <span className="sr-only">Current mode: </span>
              {HEADER_MODE_META[headerActiveMode].subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <Dialog open={modeHelpOpen} onOpenChange={setModeHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>View modes</DialogTitle>
            <DialogDescription className="sr-only">
              Short guide to Disaster, Climate, and Compare modes in DRMIS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Disaster (hazard)</strong> —{" "}
              {HEADER_MODE_META.disaster.subtitle}. Vector and tabular layers for risk
              and response.
            </p>
            <p>
              <strong className="text-foreground">Climate (trend)</strong> —{" "}
              {HEADER_MODE_META.climate.subtitle}. Baseline rasters and drivers by
              climate module.
            </p>
            <p>
              <strong className="text-foreground">Compare</strong> —{" "}
              {HEADER_MODE_META.compare.subtitle}. Use the context panel to pick years
              and swipe between them for tabular data.
            </p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setModeHelpOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Right: Simulation, Theme, Avatar - 44px touch targets on mobile */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button
          variant={simOpen ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:h-8 md:w-auto gap-1.5 px-2 md:px-2.5 text-xs",
            simOpen && "ring-1 ring-primary/30",
          )}
          onClick={() => setSimOpen(!simOpen)}
          title="Open simulation control panel"
          aria-pressed={simOpen}
        >
          <LuGauge className="size-4 md:size-3.5" />
          <span className="hidden md:inline">Simulate</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "min-h-11 min-w-11 shrink-0 touch-manipulation hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 inline-flex items-center justify-center md:size-8",
              hideUserMenu
                ? "size-11 rounded-md md:size-8"
                : "size-11 overflow-hidden rounded-full md:size-8",
            )}
            aria-label="Open menu"
          >
            {hideUserMenu ? (
              <LuMenu className="size-4 md:size-4" />
            ) : avatarUrl(user?.avatar) ? (
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
            <DropdownMenuItem asChild>
              <a
                href="https://vbos-social-section.github.io/disaster-mis-user-manual/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-inherit no-underline"
              >
                <LuBookOpen className="size-4" />
                User manual
              </a>
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
