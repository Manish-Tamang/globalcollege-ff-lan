/**
 * Everything about the tournament that isn't stored in Supabase: copy, fee,
 * rules and the points table. Edit here; every page reads from this file.
 *
 * Fields marked TODO are still to be confirmed by the organisers.
 */
export const EVENT = {
  name: "Global Free Fire LAN",
  shortName: "FF LAN",
  organiser: "GSS-IT Club",
  college: "Global School of Science",
  // Event management partner, credited in the footer.
  managedBy: "Global Associates",
  collegeUrl: "https://www.globalcollege.edu.np/",
  venue: "Global School of Science hall, Mid-Baneshwor",
  // TODO: set the real date once it is fixed, e.g. "2026-12-12T09:00:00+05:45".
  startDate: null as string | null,
  dateLabel: "Date to be announced",
  feeNpr: 400,
  // eSewa "My QR", cropped from the organiser's screenshot.
  paymentQr: "/payment-qr.png" as string | null,
  // Name the QR is registered to, shown as a note under the code.
  paymentPayee: "Devaki Silwal Tripathee" as string | null,
  paymentWallet: "eSewa",
  paymentWalletId: "9818785098",
  playersPerTeam: 4,
  contactEmail: "info@globalcollege.edu.np",
} as const;

export const SPONSORS = {
  title: {
    role: "Title sponsor",
    name: "Global College of Technology",
    short: "GCT",
    logo: { src: "/gct-logo.png", width: 369, height: 57 },
  },
  poweredBy: {
    role: "Powered by",
    name: "Global College of Social Science & Technology",
    short: "GCST",
    logo: { src: "/gcst-logo.png", width: 1461, height: 446 },
  },
} as const;


export const GRADES = ["11", "12"] as const;
export type Grade = (typeof GRADES)[number];

/** Each player ticks this exact statement before payment unlocks. */
export const CONSENT_STATEMENT =
  "I have agreed to the consent, and any violation against the rules by me will be punished and is accepted by me.";

export const STAGES = [
  { stage: "Qualifier", format: "Battle Royale Squad" },
  { stage: "Semi-final", format: "Battle Royale Squad" },
  { stage: "Grand Final", format: "Battle Royale Squad" },
] as const;

export const PLACEMENT_POINTS = [
  { place: "1st", points: 12 },
  { place: "2nd", points: 9 },
  { place: "3rd", points: 8 },
  { place: "4th", points: 7 },
  { place: "5th", points: 6 },
  { place: "6th", points: 5 },
  { place: "7th", points: 4 },
  { place: "8th", points: 3 },
  { place: "9th", points: 2 },
  { place: "10th", points: 1 },
  { place: "11th–12th", points: 0 },
] as const;

export const PENALTIES = [
  { violation: "Late arrival", penalty: "Warning or match forfeiture" },
  { violation: "Incorrect player/account", penalty: "Disqualification" },
  { violation: "Unregistered substitute", penalty: "Disqualification" },
  { violation: "Minor misconduct", penalty: "Official warning" },
  {
    violation: "Repeated misconduct",
    penalty: "Point deduction or disqualification",
  },
  { violation: "Cheating or hacking", penalty: "Immediate disqualification" },
  {
    violation: "Match fixing or collusion",
    penalty: "Disqualification of involved teams",
  },
  {
    violation: "Physical aggression or harassment",
    penalty: "Removal from venue and disciplinary referral",
  },
] as const;

export type RuleSection = {
  id: string;
  title: string;
  intro?: string;
  items: string[];
  /** Bulleted instead of numbered. */
  bullets?: boolean;
};

export const RULE_SECTIONS: RuleSection[] = [
  {
    id: "eligibility",
    title: "Team registration and eligibility",
    items: [
      "Each team must consist of exactly four players.",
      "Every player must be a currently enrolled Grade 11 or Grade 12 student.",
      "Each team must register under one unique team name.",
      "All four players must submit their correct full name, in-game name, Free Fire UID, grade and a photo of their student ID card, and the team must name the college it represents.",
      "Only registered players are allowed to participate.",
      "A team cannot change its registered players after the registration deadline without approval from the tournament committee.",
      "Each player can represent only one team.",
      "The registration fee is NPR 400 per team and is non-refundable once registration is confirmed, except if the organisers cancel the tournament.",
    ],
  },
  {
    id: "game",
    title: "Game and network",
    items: [
      "Wi-Fi will be provided by the college.",
      "Three different maps will be played.",
      "Only one game version is allowed: Free Fire. Free Fire MAX is not allowed.",
    ],
  },
  {
    id: "match-rules",
    title: "Match rules",
    items: [
      "All matches will be played in Squad mode using custom rooms.",
      "The map and match settings will be announced before the tournament.",
      "All teams must join the custom room using the provided room ID and password.",
      "Players must use their registered Free Fire accounts.",
      "Players must use their own registered devices unless the organisers announce a device arrangement.",
      "All players must follow the match administrator's instructions.",
      "Deliberate teaming between opposing squads is strictly prohibited.",
      "Exploiting bugs, glitches, hacks, scripts or unauthorised third-party applications is prohibited.",
      "Intentionally obstructing another player's device, connection or gameplay is prohibited.",
      "Players must not intentionally leave a match to gain an unfair advantage.",
    ],
  },
  {
    id: "tie-breakers",
    title: "Tie-breaker rules",
    intro:
      "If two or more teams have equal total points, rankings will be decided in this order:",
    items: [
      "Higher number of Booyahs (1st-place finishes).",
      "Higher total kill count.",
      "Better placement in the most recent match.",
      "If still tied, the tournament committee will conduct a tie-break match or apply a pre-announced additional criterion.",
    ],
  },
  {
    id: "lan",
    title: "LAN and venue rules",
    intro: "Since this is a LAN-style college event, the following rules apply:",
    items: [
      "All players must report to the venue at least 30 minutes before their scheduled match.",
      "Players must bring their own fully charged smartphones.",
      "Players should bring their own earphones or headphones.",
      "Only approved devices and accessories may be used.",
      "No player may use another person's phone during an active match unless authorised by the tournament administrator.",
      "Players must keep their phones in the approved game mode and follow the organiser's network instructions.",
      "Unauthorised VPNs, network manipulation, macros and automation tools are prohibited.",
      "Players must not use another device to communicate with teammates during a match unless explicitly permitted.",
    ],
  },
  {
    id: "technical",
    title: "Disconnections and technical issues",
    items: [
      "Players are responsible for ensuring their devices have sufficient battery and stable connectivity.",
      "A player's accidental disconnection will not automatically result in a match restart.",
      "If a major server issue, room failure or widespread network problem affects the match, the head referee may pause, restart or reschedule it.",
      "Individual device failure, low battery or accidental game closure will normally not justify a rematch.",
      "All technical decisions will be made by the tournament administrator and will be final.",
    ],
  },
  {
    id: "fair-play",
    title: "Fair play",
    intro:
      "The following actions may lead to penalties or disqualification:",
    bullets: true,
    items: [
      "Using hacks, cheats, scripts or modified game clients.",
      "Exploiting bugs or glitches for unfair advantage.",
      "Account sharing or playing with an unregistered substitute.",
      "Colluding with another team.",
      "Intentionally manipulating match results.",
      "Abusive language, harassment, bullying or threats.",
      "Deliberately disrupting another player's equipment.",
      "Refusing to follow referee instructions.",
      "Attempting to bribe or influence tournament officials.",
    ],
  },
  {
    id: "disputes",
    title: "Match supervision and disputes",
    items: [
      "Each match will be supervised by authorised match administrators.",
      "Team captains are responsible for raising complaints.",
      "Complaints must be submitted immediately after the match, before the next stage begins.",
      "Screenshots, recordings and other relevant evidence should accompany a complaint.",
      "The committee may review available match recordings and screenshots.",
      "Decisions made by the head referee and tournament committee will be final.",
    ],
  },
  {
    id: "conduct",
    title: "Code of conduct",
    bullets: true,
    items: [
      "Maintain sportsmanship and respect towards all participants.",
      "No shouting, abusive behaviour or physical confrontation.",
      "Players must not disturb ongoing matches.",
      "Only authorised players and officials may enter the competition area.",
      "Players must follow the college's rules and instructions from event staff.",
      "Any misconduct may result in removal from the tournament.",
    ],
  },
];
