import * as React from "react";

import { cn } from "@/lib/utils";
import { colors } from "@/tokens";

export type BadgeVariant = "critical" | "high" | "medium" | "low" | "info" | "generic";

const severityFill: Record<Exclude<BadgeVariant, "generic">, { bg: string; fg: string; border: string }> =
  {
    critical: {
      bg: `${colors.accent.red}22`,
      fg: colors.accent.red,
      border: colors.accent.red,
    },
    high: {
      bg: `${colors.accent.amber}22`,
      fg: colors.accent.amber,
      border: colors.accent.amber,
    },
    medium: {
      bg: `${colors.accent.amber}18`,
      fg: colors.accent.amber,
      border: colors.accent.amber,
    },
    low: {
      bg: `${colors.accent.green}22`,
      fg: colors.accent.green,
      border: colors.accent.green,
    },
    info: {
      bg: `${colors.accent.blue}22`,
      fg: colors.accent.blue,
      border: colors.accent.blue,
    },
  };

const baseClass =
  "inline-flex w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap transition-colors [&>svg]:size-3 [&>svg]:shrink-0";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Used when `variant="generic"` — any CSS colour (e.g. `#4D90FF`). */
  color?: string;
}

/**
 * Severity / status badge using DRMIS accent tokens, or a generic coloured pill.
 */
export function Badge({ className, variant = "info", color, style, children, ...props }: BadgeProps) {
  const semantic = variant !== "generic" ? severityFill[variant] : null;
  const genericColor = variant === "generic" ? (color ?? colors.text.muted) : undefined;

  return (
    <span
      className={cn(baseClass, className)}
      style={{
        ...(semantic
          ? {
              backgroundColor: semantic.bg,
              color: semantic.fg,
              borderColor: semantic.border,
            }
          : genericColor
            ? {
                backgroundColor: `${genericColor}22`,
                color: genericColor,
                borderColor: genericColor,
              }
            : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
