/**
 * Appearance button for the top bar. Opens a side panel to choose the colour theme,
 * light/dark/system mode, corner style and text size. Choices are kept in this browser.
 */
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LuCheck, LuMonitor, LuMoon, LuPalette, LuRotateCcw, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  THEME_PRESETS,
  useAppearanceStore,
  type Corners,
  type FontSize,
} from "@/store/appearance-store";
import { cn } from "@/lib/utils";

type Option<T extends string> = { id: T; label: string; icon?: React.ReactNode };

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
            value === o.id
              ? "bg-card font-semibold text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h4>
  );
}

export function AppearanceButton() {
  const { theme, setTheme } = useTheme();
  const { preset, corners, fontSize, setPreset, setCorners, setFontSize, reset } =
    useAppearanceStore();
  // next-themes only knows the stored mode after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mode = (mounted ? theme : "system") ?? "system";

  const isCustom =
    preset !== "drmis-blue" || corners !== "default" || fontSize !== "default" || mode !== "system";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Appearance: theme, light or dark mode, text size" title="Appearance: theme, light/dark mode, text size">
          <LuPalette className="size-5 icon-interactive" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Appearance</SheetTitle>
          <SheetDescription>Choose how the interface looks on this device.</SheetDescription>
        </SheetHeader>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <SectionTitle>Theme</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((p) => {
                const active = preset === p.id;
                const [main, dark, light] = p.swatch;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      "relative rounded-xl border-2 p-2.5 text-left transition-colors",
                      active ? "border-primary" : "border-border hover:border-muted-foreground/40",
                    )}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <LuCheck className="size-3" />
                      </span>
                    )}
                    <span className="mb-2 flex h-12 gap-1.5 rounded-lg bg-muted p-2">
                      <span className="flex w-3 flex-col gap-1">
                        <span className="h-1.5 rounded-sm" style={{ background: main }} />
                        <span className="h-1 rounded-sm bg-border" />
                        <span className="h-1 rounded-sm bg-border" />
                      </span>
                      <span className="flex flex-1 flex-col gap-1">
                        <span className="h-2 rounded-sm" style={{ background: main }} />
                        <span className="mt-auto flex gap-1">
                          <span className="h-2.5 flex-1 rounded-sm" style={{ background: dark }} />
                          <span className="h-2.5 flex-1 rounded-sm" style={{ background: main }} />
                          <span className="h-2.5 flex-1 rounded-sm" style={{ background: light }} />
                        </span>
                      </span>
                    </span>
                    <span className="block text-sm font-semibold text-foreground">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle>Colour mode</SectionTitle>
            <Segmented
              label="Colour mode"
              value={mode}
              onChange={setTheme}
              options={[
                { id: "light", label: "Light", icon: <LuSun className="size-3.5" /> },
                { id: "dark", label: "Dark", icon: <LuMoon className="size-3.5" /> },
                { id: "system", label: "System", icon: <LuMonitor className="size-3.5" /> },
              ]}
            />
          </div>

          <div>
            <SectionTitle>Corners</SectionTitle>
            <Segmented<Corners>
              label="Corners"
              value={corners}
              onChange={setCorners}
              options={[
                { id: "sharp", label: "Sharp" },
                { id: "default", label: "Default" },
                { id: "rounded", label: "Rounded" },
              ]}
            />
          </div>

          <div>
            <SectionTitle>Text size</SectionTitle>
            <Segmented<FontSize>
              label="Text size"
              value={fontSize}
              onChange={setFontSize}
              options={[
                { id: "small", label: "Small" },
                { id: "default", label: "Default" },
                { id: "large", label: "Large" },
                { id: "xlarge", label: "Extra" },
              ]}
            />
          </div>
        </div>

        <div className="border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={!isCustom}
            onClick={() => {
              reset();
              setTheme("system");
            }}
          >
            <LuRotateCcw className="size-3.5" />
            Reset to default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
