import { GridSection } from "../ui/grid-section";
import { SectionHeading } from "../ui/section-heading";
import { FeatureGrid, FeatureItem } from "../ui/feature-grid";
import { CheckList } from "../ui/check-list";
import { EVENT } from "../../data/event";

const COLUMNS = [
  {
    title: "Who can play",
    items: [
      "Squads of exactly four players",
      "Grade 11 or 12 students, all from the same college",
      "One unique team name per squad",
      "Each player represents only one team",
    ],
  },
  {
    title: "What to bring",
    items: [
      "Your own fully charged smartphone",
      "Earphones or headphones",
      "Your student ID card",
      "Arrive 30 minutes before your match",
    ],
  },
  {
    title: "What you register",
    items: [
      "Real name, in-game name and Free Fire UID",
      "Your college and each player's class",
      "Photo of every player's student ID card",
      "WhatsApp number for every player",
      `NPR ${EVENT.feeNpr} payment screenshot`,
    ],
  },
];

export function Eligibility() {
  return (
    <GridSection innerClassName="px-6 py-20 sm:px-10">
      <SectionHeading title="Before you register" />
      <FeatureGrid className="mt-12">
        {COLUMNS.map(({ title, items }) => (
          <FeatureItem key={title} title={title}>
            <CheckList items={items.map((text) => ({ _key: text, text }))} />
          </FeatureItem>
        ))}
      </FeatureGrid>
    </GridSection>
  );
}
