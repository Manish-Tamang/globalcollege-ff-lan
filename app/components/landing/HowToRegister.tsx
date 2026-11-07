import { GridSection } from "../ui/grid-section";
import { SectionHeading } from "../ui/section-heading";
import { EVENT } from "../../data/event";

const STEPS = [
  { title: "Pick a team name", body: "It has to be unique. The form tells you straight away if it is taken." },
  { title: "Add all four players", body: "Name, in-game name, UID, class, WhatsApp and a photo of each student ID card. Player 1 leads the team." },
  { title: "Read the rules and agree", body: "Every player accepts the consent statement. Payment stays locked until all four have." },
  { title: `Pay NPR ${EVENT.feeNpr} and upload`, body: "Scan the eSewa QR and upload the screenshot. The organisers verify it and confirm your slot." },
];

export function HowToRegister() {
  return (
    <GridSection id="how-to-register" innerClassName="px-6 py-20 sm:px-10">
      <SectionHeading
        title="How to register"
        description="About five minutes, if you have everyone's UID and a photo of each ID card ready."
      />
      <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ title, body }, index) => (
          <li key={title} className="rounded-xl bg-white p-5 shadow-sm shadow-black/5 ring-1 ring-black/5">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
              {index + 1}
            </span>
            <h3 className="mt-6 text-base font-semibold tracking-tight text-neutral-800">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{body}</p>
          </li>
        ))}
      </ol>
    </GridSection>
  );
}
