import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface GridSectionProps extends HTMLAttributes<HTMLElement> {
  /** Classes for the framed column (padding, layout). */
  innerClassName?: string;
  /** Dotted rule under the section. On by default. */
  divider?: boolean;
}

/**
 * One band of the page: a 1080px column framed by dotted lines, with a
 * dotted rule underneath so stacked sections read as one sheet.
 */
export function GridSection({ children, className, innerClassName, divider = true, ...props }: GridSectionProps) {
  return (
    <section className={cn("relative px-4", className)} {...props}>
      <div className={cn("frame", innerClassName)}>{children}</div>
      {divider && (
        <div className="frame" aria-hidden="true">
          <div className="dots-x mx-2" />
        </div>
      )}
    </section>
  );
}
