import { GridSection } from "../ui/grid-section";
import { RulesList } from "../RulesList";
import { CONSENT_STATEMENT } from "../../data/event";

export function RulesSection() {
  return (
    <GridSection id="rules" innerClassName="grid grid-cols-1 gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="section-title text-3xl sm:text-[32px] sm:leading-tight">Rules and fair play</h2>
        <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600">
          Every player reads these. Payment only unlocks after all four players
          accept this statement on the registration form.
        </p>
        <blockquote className="mt-6 rounded-xl bg-brand-50 p-4 text-[15px] leading-relaxed text-brand-900 ring-1 ring-brand-100">
          “{CONSENT_STATEMENT}”
        </blockquote>
      </div>
      <RulesList collapsible />
    </GridSection>
  );
}
