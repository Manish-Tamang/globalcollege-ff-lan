import { GridSection } from "../ui/grid-section";
import { SectionHeading } from "../ui/section-heading";
import { CheckList } from "../ui/check-list";
import { STAGES } from "../../data/event";

const MATCH_SETUP = [
  "Squad mode in custom rooms. Room ID and password are shared before each match.",
  "Three different maps. Map and match settings are announced before the tournament.",
  "Free Fire only. Free Fire MAX is not allowed.",
  "Wi-Fi is provided by the college. Bring your own charged phone and earphones.",
];

export function Format() {
  return (
    <GridSection id="format" innerClassName="px-6 py-20 sm:px-10">
      <SectionHeading
        title={<>Three stages to the <span className="hl">Booyah</span></>}
        description="Every stage is Battle Royale Squad. Survive the qualifier, make the semi-final, and the best squads meet in the grand final."
      />

      <ol className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
        {STAGES.map(({ stage, format }, index) => (
          <li key={stage} className="rounded-xl bg-white p-5 shadow-sm shadow-black/5 ring-1 ring-black/5">
            <span className="font-mono text-xs text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mt-8 text-lg font-semibold tracking-tight text-neutral-800">{stage}</h3>
            <p className="mt-1 text-sm text-neutral-500">{format}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <h3 className="text-base font-semibold tracking-tight text-neutral-800">Match setup</h3>
        <CheckList items={MATCH_SETUP.map((text) => ({ _key: text, text }))} />
      </div>
    </GridSection>
  );
}
