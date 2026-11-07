import { GridSection } from "../ui/grid-section";
import { SectionHeading } from "../ui/section-heading";
import { PLACEMENT_POINTS, RULE_SECTIONS } from "../../data/event";

const TIE_BREAKERS = RULE_SECTIONS.find((s) => s.id === "tie-breakers")!;

export function Points() {
  return (
    <GridSection id="points" innerClassName="grid grid-cols-1 lg:grid-cols-2">
      <div className="px-6 py-20 sm:px-10">
        <SectionHeading title="Placement points" description="Points per match, by where your squad finishes." />
        <div className="mt-10 overflow-hidden rounded-xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/5">
          <table className="w-full text-[15px]">
            <thead className="text-left text-sm text-neutral-500">
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 font-medium">Placement</th>
                <th className="px-5 py-3 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {PLACEMENT_POINTS.map(({ place, points }, index) => (
                <tr key={place}>
                  <td className="px-5 py-2.5 text-neutral-700">
                    {place}
                    {index === 0 && <span className="ml-2 text-sm text-brand-600">Booyah</span>}
                  </td>
                  <td className="px-5 py-2.5 text-right font-medium tabular-nums text-neutral-800">{points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="relative px-6 pb-20 sm:px-10 lg:pt-20">
        <span className="dots-y absolute inset-y-0 left-0 hidden lg:block" aria-hidden="true" />
        <SectionHeading title="Tie-breakers" description={TIE_BREAKERS.intro} />
        <ol className="mt-10 space-y-6">
          {TIE_BREAKERS.items.map((item, index) => (
            <li key={item} className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
                {index + 1}
              </span>
              <p className="pt-0.5 text-[15px] leading-relaxed text-neutral-700">{item}</p>
            </li>
          ))}
        </ol>
      </div>
    </GridSection>
  );
}
