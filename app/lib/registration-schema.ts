import { z } from "zod";
import { CONSENT_STATEMENT, GRADES } from "@/app/data/event";

/** Nepali mobile: 98XXXXXXXX / 97XXXXXXXX, optionally prefixed with +977. */
export const WHATSAPP_PATTERN = /^(?:\+?977[- ]?)?9[678]\d{8}$/;
/** Free Fire UIDs are numeric; allow some slack on length. */
export const UID_PATTERN = /^\d{6,13}$/;

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
/** Whole multipart request, kept under Vercel's 4.5 MB body limit. */
export const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024;
export const SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const teamNameSchema = z
  .string()
  .trim()
  .min(2, "Team name must be at least 2 characters")
  .max(32, "Team name must be 32 characters or fewer");

export const collegeSchema = z
  .string()
  .trim()
  .min(3, "Enter the college your team represents")
  .max(120, "College name is too long");

export const playerSchema = z.object({
  real_name: z.string().trim().min(2, "Enter the player's real name").max(80),
  ign: z.string().trim().min(1, "Enter the in-game name").max(32),
  ff_uid: z
    .string()
    .trim()
    .regex(UID_PATTERN, "UID should be 6–13 digits, numbers only"),
  grade: z.enum(GRADES, "Choose Class 11 or 12"),
  whatsapp: z
    .string()
    .trim()
    .regex(WHATSAPP_PATTERN, "Enter a valid Nepali number, e.g. 98XXXXXXXX"),
  consent: z.literal(true, "Each player must accept the consent statement"),
});

export const registrationSchema = z
  .object({
    team_name: teamNameSchema,
    college: collegeSchema,
    transaction_id: z.string().trim().max(60).optional().default(""),
    consent_statement: z.literal(CONSENT_STATEMENT),
    players: z.array(playerSchema).length(4, "A team needs exactly 4 players"),
  })
  .superRefine((value, ctx) => {
    // "Each player can represent only one team" starts inside the team itself.
    const seenUids = new Map<string, number>();
    value.players.forEach((player, index) => {
      const uidSlot = seenUids.get(player.ff_uid);
      if (uidSlot !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["players", index, "ff_uid"],
          message: `Same UID as Player ${uidSlot + 1}`,
        });
      } else seenUids.set(player.ff_uid, index);
    });
  });

export type PlayerInput = z.input<typeof playerSchema>;
export type RegistrationInput = z.input<typeof registrationSchema>;
