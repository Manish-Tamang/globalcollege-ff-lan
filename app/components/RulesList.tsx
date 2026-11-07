import { PENALTIES, RULE_SECTIONS, type RuleSection } from "../data/event";
import { cn } from "../lib/utils";
import { ChevronRightIcon } from "./icons/ui-icons";

/**
 * Every rule from the organisers' guide. `collapsible` turns each section
 * into a disclosure (landing page); otherwise everything is expanded
 * (registration step, where players must read it all).
 */
export function RulesList({ collapsible = false }: { collapsible?: boolean }) {
  return (
    <div className="divide-y divide-neutral-200">
      {RULE_SECTIONS.map((section, index) => (
        <RuleBlock
          key={section.id}
          section={section}
          number={index + 1}
          collapsible={collapsible}
        />
      ))}
      <PenaltyBlock number={RULE_SECTIONS.length + 1} collapsible={collapsible} />
    </div>
  );
}

function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <span className="flex items-baseline gap-3 font-semibold tracking-tight text-neutral-800">
      <span className="font-mono text-xs font-normal text-neutral-400">
        {String(number).padStart(2, "0")}
      </span>
      {title}
    </span>
  );
}

function Disclosure({
  title,
  number,
  collapsible,
  children,
}: {
  title: string;
  number: number;
  collapsible: boolean;
  children: React.ReactNode;
}) {
  if (!collapsible) {
    return (
      <div className="py-5">
        <h3>
          <SectionTitle number={number} title={title} />
        </h3>
        <div className="mt-3 pl-7">{children}</div>
      </div>
    );
  }

  return (
    <details className="group py-1" open={number === 1}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <SectionTitle number={number} title={title} />
        <ChevronRightIcon className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-5 pl-7">{children}</div>
    </details>
  );
}

function RuleBlock({
  section,
  number,
  collapsible,
}: {
  section: RuleSection;
  number: number;
  collapsible: boolean;
}) {
  const List = section.bullets ? "ul" : "ol";
  return (
    <Disclosure title={section.title} number={number} collapsible={collapsible}>
      {section.intro && (
        <p className="mb-3 text-sm text-neutral-600">{section.intro}</p>
      )}
      <List
        className={cn(
          "space-y-2 pl-5 text-sm leading-relaxed text-neutral-600 marker:text-neutral-400",
          section.bullets ? "list-disc" : "list-decimal",
        )}
      >
        {section.items.map((item) => (
          <li key={item} className="pl-1">
            {item}
          </li>
        ))}
      </List>
    </Disclosure>
  );
}

function PenaltyBlock({
  number,
  collapsible,
}: {
  number: number;
  collapsible: boolean;
}) {
  return (
    <Disclosure title="Penalties" number={number} collapsible={collapsible}>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/5">
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Violation</th>
              <th className="px-4 py-2.5 font-medium">Possible penalty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {PENALTIES.map(({ violation, penalty }) => (
              <tr key={violation}>
                <td className="px-4 py-2.5">{violation}</td>
                <td className="px-4 py-2.5">{penalty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Disclosure>
  );
}
