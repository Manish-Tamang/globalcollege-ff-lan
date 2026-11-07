import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/** Columns of short lists, split by dotted rules on wide screens. */
export function FeatureGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0", className)}>{children}</div>;
}

export function FeatureItem({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="group/item relative md:px-8 md:first:pl-0 md:last:pr-0">
      <span className="dots-y absolute inset-y-0 left-0 hidden md:block md:group-first/item:hidden" aria-hidden="true" />
      <h3 className="text-base font-semibold tracking-tight text-neutral-800">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
