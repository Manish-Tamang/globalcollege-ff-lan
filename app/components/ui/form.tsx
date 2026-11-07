import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/** Shared look for text inputs, selects and textareas. */
export const inputClassName =
  "block w-full rounded-[10px] border-0 bg-white px-3 py-2.5 text-[15px] text-neutral-900 shadow-sm shadow-black/[0.03] ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-400 transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500";

export const fileInputClassName = cn(
  inputClassName,
  "py-2 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neutral-800 hover:file:bg-neutral-200",
);

/** Label above a control, with an optional hint underneath. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-[13px] leading-snug text-neutral-500">{hint}</p>}
    </div>
  );
}

/** Band that holds a form: a white card centred in the dotted frame. */
export function FormPanel({ children }: { children: ReactNode }) {
  return (
    <section className="relative px-4">
      <div className="frame px-0 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-[760px] rounded-2xl bg-white p-5 shadow-sm shadow-black/5 ring-1 ring-black/5 sm:p-8">
          {children}
        </div>
      </div>
      <div className="frame" aria-hidden="true">
        <div className="dots-x mx-2" />
      </div>
    </section>
  );
}
