/**
 * Minimal header: logo + title | avatar, theme toggle.
 * Sticky with glass blur + shadow on scroll. Inter/SF Pro typography.
 */
import { useState, useCallback, useEffect } from "react";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AppearanceButton } from "@/components/AppearancePanel";
import { EventPicker } from "@/components/EventPicker";
import { AreaPicker } from "@/components/AreaPicker";
import {
  LuCircleHelp,
  LuLanguages,
  LuLockKeyhole,
  LuLock,
  LuLogOut,
  LuSettings,
  LuShare2,
  LuUser,
  LuCopy,
  LuCheck,
} from "react-icons/lu";
import { useAuthStore } from "@/store/auth-store";
import { useLockStore } from "@/store/lock-store";
import { ProfileSettingsDialog } from "@/components/ProfileSettingsDialog";
import { toast } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { SITE } from "@/config/site";
import { LANGUAGES, useLangStore, useT, type Lang } from "@/i18n";
import { useLowData, useLowDataStore } from "@/store/low-data-store";

export const Header = () => {
  const [shareDialogIsOpen, setShareDialogIsOpen] = useState(false);
  const [profileDialogIsOpen, setProfileDialogIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const { lock, pinHash, resetLockOnLogout } = useLockStore();
  const { t, lang } = useT();
  const setLang = useLangStore((s) => s.setLang);
  const lowData = useLowData();
  const setLowDataPreference = useLowDataStore((s) => s.setPreference);

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
        // Below md the picker drops to a second row so both dropdowns stay full size
        "sticky top-0 z-[100] flex min-h-14 min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-1.5 transition-shadow duration-200 md:h-14 md:flex-nowrap md:overflow-hidden md:py-0 print:hidden",
        "border-b border-border glass-surface-strong",
        "shadow-[0_1px_0_0_var(--border)]",
        scrolled && "shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_0_0_var(--border),0_4px_12px_-2px_rgba(0,0,0,0.25)]",
      )}
    >
      {/* Left: crest (when configured), logo and title */}
      <div className="flex shrink-0 items-center gap-3">
        {SITE.crestUrl && (
          <img src={SITE.crestUrl} alt={SITE.government} className="h-9 w-auto shrink-0" />
        )}
        <img
          src="/MISLogo.svg"
          alt=""
          className="size-8 shrink-0"
        />
        <div className="flex flex-col gap-0">
          <h1
            className="font-sans text-sm font-bold tracking-tight text-foreground"
            title={t("app.title")}
          >
            {SITE.shortName}
          </h1>
          {/* Hidden on narrower screens to leave room for the year and event picker */}
          <span className="hidden max-w-[22rem] truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground xl:inline">
            {SITE.agency || t("app.title")}
          </span>
        </div>
      </div>

      {/* Middle: the four global filters. When: year and event. Where: province and area council. */}
      <div className="order-last flex min-w-0 basis-full flex-wrap items-center justify-center gap-2 md:order-none md:flex-1 md:basis-auto md:flex-nowrap">
        <EventPicker />
        <span className="hidden h-5 w-px shrink-0 bg-border md:block" aria-hidden />
        <AreaPicker />
      </div>

      {/* Right: Appearance (theme, light/dark, text size), Avatar */}
      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold uppercase text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={`${t("lang.label")}: ${LANGUAGES.find((l) => l.code === lang)?.name}`}
            title={t("lang.label")}
          >
            <LuLanguages className="size-4" aria-hidden />
            {lang}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              {t("lang.label")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
              {LANGUAGES.map((l) => (
                <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code}>
                  {l.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AppearanceButton />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-8 inline-flex items-center justify-center"
            aria-label="Open menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <LuUser className="size-4 icon-interactive" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem]">
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              {user?.username}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <LuCircleHelp className="size-4" />
              Help
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setProfileDialogIsOpen(true)}>
              <LuSettings className="size-4" />
              Profile & security
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShareDialogIsOpen(true)}>
              <LuShare2 className="size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={lowData.active}
              onCheckedChange={(on) => setLowDataPreference(on ? "on" : "off")}
              onSelect={(e) => e.preventDefault()}
              title={lowData.automatic ? t("lowData.auto") : t("lowData.help")}
            >
              {t("lowData.label")}
            </DropdownMenuCheckboxItem>
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
      <ProfileSettingsDialog
        isOpen={profileDialogIsOpen}
        onClose={() => setProfileDialogIsOpen(false)}
      />
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
