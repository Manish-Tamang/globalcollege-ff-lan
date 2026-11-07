import type { Grade } from "@/app/data/event";

export type RegistrationStatus = "pending" | "verified" | "rejected";

export type PlayerRow = {
  id: string;
  team_id: string;
  slot: number;
  is_captain: boolean;
  real_name: string;
  ign: string;
  ff_uid: string;
  grade: Grade;
  id_card_path: string;
  whatsapp: string;
  consent_at: string;
};

export type TeamRow = {
  id: string;
  team_name: string;
  college: string;
  status: RegistrationStatus;
  payment_screenshot_path: string;
  transaction_id: string | null;
  consent_statement: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  players: PlayerRow[];
};
