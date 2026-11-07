import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

const REVEAL = "animate-slide-up-fade motion-reduce:animate-fade-in";

interface PageHeroProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small line above the title. */
  eyebrow?: ReactNode;
  align?: "left" | "center";
  children?: ReactNode;
}

/** Opening band for inner pages: brand sky, title, short description. */
export function PageHero({ title, description, eyebrow, align = "center", children }: PageHeroProps) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true">
        <div className="sky absolute inset-0" />
        <div className="sky-dots absolute inset-0" />
      </div>
      <div className="frame px-4 pb-12 pt-32 sm:pt-36">
        <div className={cn("relative flex flex-col", centered ? "mx-auto max-w-xl items-center text-center" : "max-w-2xl")}>
          {eyebrow && <div className={cn("mb-5 [--offset:10px]", REVEAL)}>{eyebrow}</div>}
          <h1 className={cn("section-title text-4xl leading-[1.15] [--offset:20px] sm:text-5xl", REVEAL)}>{title}</h1>
          {description && (
            <div className={cn("mt-5 text-pretty text-base leading-relaxed text-neutral-700 [animation-delay:100ms] sm:text-lg", REVEAL)}>
              {description}
            </div>
          )}
        </div>
        {children && <div className={cn("relative [animation-delay:200ms]", REVEAL)}>{children}</div>}
      </div>
      <div className="frame" aria-hidden="true">
        <div className="dots-x mx-2" />
      </div>
    </section>
  );
}
