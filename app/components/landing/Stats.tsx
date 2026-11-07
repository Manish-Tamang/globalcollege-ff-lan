import { GridSection } from "../ui/grid-section";
import { EVENT } from "../../data/event";

const STATS = [
  { value: String(EVENT.playersPerTeam), label: "Players per squad" },
  { value: `NPR ${EVENT.feeNpr}`, label: "Entry fee per team" },
  { value: "3", label: "Maps" },
  { value: "3", label: "Stages to the final" },
];

export function Stats() {
  return (
    <GridSection>
      <dl className="grid grid-cols-2 md:grid-cols-4">
        {STATS.map((stat, index) => (
          <div key={stat.label} className="relative flex flex-col items-center gap-1 px-4 py-8 text-center">
            {index > 0 && (
              <span
                className={`dots-y absolute inset-y-4 left-0 ${index === 2 ? "hidden md:block" : ""}`}
                aria-hidden="true"
              />
            )}
            <dd className="text-3xl font-semibold tracking-tight tabular-nums text-neutral-800">{stat.value}</dd>
            <dt className="order-last text-sm text-neutral-500">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </GridSection>
  );
}
