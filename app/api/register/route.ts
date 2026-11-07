import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/app/lib/supabase/server";
import { verifyTurnstile } from "@/app/lib/turnstile-server";
import {
  MAX_SCREENSHOT_BYTES,
  SCREENSHOT_TYPES,
  registrationSchema,
} from "@/app/lib/registration-schema";

const PAYMENT_BUCKET = "payment-proofs";
const ID_CARD_BUCKET = "id-cards";

/** Unique constraints from supabase/schema.sql → messages for the form. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  teams_team_name_key: "Team name already taken. Please choose another.",
  players_ff_uid_key:
    "One of these Free Fire UIDs is already registered with another team.",
};

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Returns an error message, or null if the file is an acceptable image. */
function checkImage(file: FormDataEntryValue | null, label: string): string | null {
  if (!(file instanceof File) || file.size === 0) return `Please upload ${label}.`;
  if (!SCREENSHOT_TYPES.includes(file.type)) return `${label[0].toUpperCase()}${label.slice(1)} must be a JPG, PNG or WebP image.`;
  if (file.size > MAX_SCREENSHOT_BYTES) return `${label[0].toUpperCase()}${label.slice(1)} must be 5 MB or smaller.`;
  return null;
}

const extensionOf = (file: File) => file.type.split("/")[1].replace("jpeg", "jpg");

type Uploaded = { bucket: string; path: string };

async function removeAll(supabase: SupabaseClient, uploaded: Uploaded[]) {
  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of uploaded) byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), path]);
  await Promise.all([...byBucket].map(([bucket, paths]) => supabase.storage.from(bucket).remove(paths)));
}

/**
 * POST multipart/form-data
 *   payload       JSON matching registrationSchema
 *   screenshot    payment screenshot
 *   id_card_1..4  student ID card photo for each player
 *   turnstile     Cloudflare Turnstile token
 * Images: JPG/PNG/WebP, ≤ 5 MB each (the form shrinks them before sending).
 */
export async function POST(request: Request) {
  const supabase = getServiceSupabase();
  if (!supabase) return fail("Registration is not configured yet.", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid form submission. If your photos are very large, try smaller ones.");
  }

  // Bot check before anything touches the database or storage.
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyTurnstile(String(form.get("turnstile") ?? "") || null, ip))) {
    return fail("Verification failed. Please complete the check and try again.", 403);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return fail("Invalid form submission.");
  }

  const parsed = registrationSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const registration = parsed.data;

  const screenshot = form.get("screenshot");
  const screenshotError = checkImage(screenshot, "the payment screenshot");
  if (screenshotError) return fail(screenshotError);

  const idCards = registration.players.map((_, i) => form.get(`id_card_${i + 1}`));
  for (const [i, card] of idCards.entries()) {
    const error = checkImage(card, `Player ${i + 1}'s student ID card`);
    if (error) return fail(error);
  }

  // Cheap checks first so a closed form or taken name doesn't upload files.
  const { data: settings } = await supabase
    .from("settings")
    .select("registration_open")
    .eq("id", true)
    .maybeSingle();
  if (settings && !settings.registration_open) {
    return fail("Registration is closed.", 403);
  }

  const { data: available } = await supabase.rpc("team_name_available", {
    p_name: registration.team_name,
  });
  if (available === false) {
    return fail(CONSTRAINT_MESSAGES.teams_team_name_key, 409);
  }

  // One folder per submission keeps a team's files together.
  const folder = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
  const payment = screenshot as File;
  const uploads: (Uploaded & { file: File })[] = [
    { bucket: PAYMENT_BUCKET, path: `${folder}/payment.${extensionOf(payment)}`, file: payment },
    ...idCards.map((card, i) => {
      const file = card as File;
      return { bucket: ID_CARD_BUCKET, path: `${folder}/player-${i + 1}.${extensionOf(file)}`, file };
    }),
  ];

  const results = await Promise.all(
    uploads.map(({ bucket, path, file }) =>
      supabase.storage.from(bucket).upload(path, file, { contentType: file.type }),
    ),
  );
  const uploaded = uploads.filter((_, i) => !results[i].error);
  if (uploaded.length !== uploads.length) {
    console.error("registration upload failed", results.find((r) => r.error)?.error);
    await removeAll(supabase, uploaded);
    return fail("Could not upload your images. Please try again.", 500);
  }

  const { data: teamId, error } = await supabase.rpc("register_team", {
    p_team: {
      team_name: registration.team_name,
      college: registration.college,
      transaction_id: registration.transaction_id,
      consent_statement: registration.consent_statement,
      payment_screenshot_path: uploads[0].path,
    },
    p_players: registration.players.map((player, index) => ({
      slot: index + 1,
      real_name: player.real_name,
      ign: player.ign,
      ff_uid: player.ff_uid,
      grade: player.grade,
      id_card_path: uploads[index + 1].path,
      whatsapp: player.whatsapp,
    })),
  });

  if (error) {
    // Nothing was saved, so don't keep orphaned images.
    await removeAll(supabase, uploaded);

    if (error.message?.includes("registration_closed")) {
      return fail("Registration is closed.", 403);
    }
    const constraint = Object.keys(CONSTRAINT_MESSAGES).find((name) =>
      error.message?.includes(name),
    );
    if (constraint) return fail(CONSTRAINT_MESSAGES[constraint], 409);

    console.error("register_team failed", error);
    return fail("Something went wrong. Please try again.", 500);
  }

  return NextResponse.json({ id: teamId, teamName: registration.team_name });
}
