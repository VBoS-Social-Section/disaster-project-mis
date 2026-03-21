import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Design-system button (DRMIS tokens). For shadcn-style buttons, use `./button`.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-[color,background-color,opacity,box-shadow,border-color] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[#FF4B2B] text-white shadow-sm hover:opacity-90 focus-visible:ring-[#FF4B2B]",
        ghost:
          "border border-[var(--drmis-border-default)] bg-transparent text-[var(--drmis-text-primary)] shadow-sm hover:bg-[var(--drmis-bg-overlay)] focus-visible:ring-[var(--drmis-border-strong)]",
        danger:
          "border-2 border-[#FF4B2B] bg-transparent text-[#FF4B2B] shadow-sm hover:bg-[#FF4B2B]/10 focus-visible:ring-[#FF4B2B]",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5 [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm gap-2 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
