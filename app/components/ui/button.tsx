import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** Classes for the glossy Alfsight-style buttons in globals.css. */
export function buttonClassName({
  variant = "primary",
  size = "md",
}: { variant?: ButtonVariant; size?: "sm" | "md" } = {}) {
  return cn("btn", VARIANTS[variant], size === "sm" && "btn-sm");
}

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  /** Keeps the link but shows it as unavailable (e.g. registration closed). */
  disabled?: boolean;
}

export function Button({ href, variant, size, disabled, className, ...props }: ButtonProps) {
  return (
    <Link
      href={href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(buttonClassName({ variant, size }), className)}
      {...props}
    />
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("size-4", className)}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
