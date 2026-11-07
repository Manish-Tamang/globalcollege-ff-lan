import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Buttons or links shown under the copy. */
  children?: ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, align = "left", children, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col", align === "center" ? "items-center text-center" : "items-start text-left", className)}>
      <h2 className="section-title max-w-2xl text-3xl sm:text-[32px] sm:leading-tight">{title}</h2>
      {description && (
        <div className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-neutral-600">{description}</div>
      )}
      {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}
