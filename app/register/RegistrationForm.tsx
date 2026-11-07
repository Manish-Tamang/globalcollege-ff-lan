"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FormPanel, Field, inputClassName, fileInputClassName } from "../components/ui/form";
import { buttonClassName } from "../components/ui/button";
import { CheckIcon } from "../components/icons/ui-icons";
import { RulesList } from "../components/RulesList";
import { cn } from "../lib/utils";
import {
  CONSENT_STATEMENT,
  EVENT,
  GRADES,
} from "../data/event";
import { compressImage } from "../lib/compress-image";
import { TURNSTILE_SITE_KEY, useTurnstile } from "../lib/use-turnstile";
import {
  MAX_TOTAL_UPLOAD_BYTES,
  SCREENSHOT_TYPES,
  playerSchema,
  registrationSchema,
  teamNameSchema,
  collegeSchema,
} from "../lib/registration-schema";

type PlayerDraft = {
  real_name: string;
  ign: string;
  ff_uid: string;
  grade: string;
  /** Photo of the student ID card. */
  idCard: File | null;
  whatsapp: string;
  consent: boolean;
};

type NameStatus = "idle" | "checking" | "available" | "taken" | "unknown";
type Errors = Record<string, string>;

const STEPS = ["Team", "Players", "Rules", "Payment"] as const;

const emptyPlayer = (): PlayerDraft => ({
  real_name: "",
  ign: "",
  ff_uid: "",
  grade: "",
  idCard: null,
  whatsapp: "",
  consent: false,
});

const playerDetailsSchema = playerSchema.omit({ consent: true });

// Photos straight off a phone can be large; they're shrunk before upload.
const MAX_PICK_BYTES = 15 * 1024 * 1024;

const secondaryButton = cn(
  buttonClassName({ variant: "secondary" }),
  "disabled:cursor-not-allowed disabled:opacity-60",
);
const primaryButton = cn(
  buttonClassName(),
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:hover:ring-0",
);

export function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("");
  const [nameStatus, setNameStatus] = useState<NameStatus>("idle");
  const [players, setPlayers] = useState<PlayerDraft[]>(() =>
    Array.from({ length: EVENT.playersPerTeam }, emptyPlayer),
  );
  const [rulesRead, setRulesRead] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // Cloudflare bot check, shown on the payment step only.
  const {
    containerRef: turnstileRef,
    token: turnstileToken,
    reset: resetTurnstile,
  } = useTurnstile(step === 3 && !registered);
  const needsTurnstile = Boolean(TURNSTILE_SITE_KEY);

  const allConsented = players.every((p) => p.consent);

  // --- team name availability ("Team name already taken" from the system)
  const nameCheckId = useRef(0);
  async function checkTeamName(name: string): Promise<NameStatus> {
    const id = ++nameCheckId.current;
    if (!teamNameSchema.safeParse(name).success) {
      setNameStatus("idle");
      return "idle";
    }
    setNameStatus("checking");
    let status: NameStatus = "unknown";
    try {
      const res = await fetch(`/api/team-name?name=${encodeURIComponent(name.trim())}`);
      if (res.ok) {
        const data = (await res.json()) as { available: boolean };
        status = data.available ? "available" : "taken";
      }
    } catch {
      status = "unknown";
    }
    if (id === nameCheckId.current) setNameStatus(status);
    return status;
  }

  useEffect(() => {
    if (!teamName.trim()) return;
    const timer = setTimeout(() => void checkTeamName(teamName), 450);
    return () => clearTimeout(timer);
  }, [teamName]);

  // --- helpers
  function updatePlayer(index: number, patch: Partial<PlayerDraft>) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[`players.${index}.${key}`];
      return next;
    });
  }

  function goTo(next: number) {
    setStep(next);
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // --- per-step validation
  async function validateTeam(): Promise<boolean> {
    const parsed = teamNameSchema.safeParse(teamName);
    const collegeParsed = collegeSchema.safeParse(college);
    if (!parsed.success || !collegeParsed.success) {
      setErrors({
        ...(parsed.success ? {} : { team_name: parsed.error.issues[0].message }),
        ...(collegeParsed.success ? {} : { college: collegeParsed.error.issues[0].message }),
      });
      return false;
    }
    const status =
      nameStatus === "available" || nameStatus === "taken"
        ? nameStatus
        : await checkTeamName(teamName);
    if (status === "taken") {
      setErrors({ team_name: "Team name already taken. Please choose another." });
      return false;
    }
    return true;
  }

  function validatePlayers(): boolean {
    const next: Errors = {};
    const uids = new Map<string, number>();

    players.forEach((player, index) => {
      const parsed = playerDetailsSchema.safeParse(player);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = `players.${index}.${String(issue.path[0])}`;
          next[key] ??= issue.message;
        }
      }
      const uid = player.ff_uid.trim();
      if (uid) {
        if (uids.has(uid)) next[`players.${index}.ff_uid`] = `Same UID as Player ${uids.get(uid)! + 1}`;
        else uids.set(uid, index);
      }
      if (!player.idCard) next[`players.${index}.idCard`] = "Upload a photo of the student ID card";
    });

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Some player details need fixing.");
      return false;
    }
    return true;
  }

  async function handleNext() {
    if (step === 0 && !(await validateTeam())) return;
    if (step === 1 && !validatePlayers()) return;
    if (step === 2 && !(rulesRead && allConsented)) {
      toast.error(
        rulesRead
          ? "All four players must accept the consent statement."
          : "Please read the rules to the end first.",
      );
      return;
    }
    goTo(step + 1);
  }

  async function handleSubmit() {
    if (!screenshot) {
      setErrors({ screenshot: "Upload the payment screenshot." });
      return;
    }

    if (needsTurnstile && !turnstileToken) {
      toast.error("Please complete the verification check first.");
      return;
    }

    const parsed = registrationSchema.safeParse({
      team_name: teamName,
      college,
      transaction_id: transactionId,
      consent_statement: CONSENT_STATEMENT,
      players,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setSubmitting(true);
    try {
      // Shrink phone photos so the whole request stays under the host's limit.
      const [payment, ...idCards] = await Promise.all(
        [screenshot, ...players.map((p) => p.idCard as File)].map((file) => compressImage(file)),
      );
      const total = [payment, ...idCards].reduce((sum, f) => sum + f.size, 0);
      if (total > MAX_TOTAL_UPLOAD_BYTES) {
        throw new Error("Your photos are too large to upload together. Try clearer, smaller photos or screenshots.");
      }

      const body = new FormData();
      body.append("payload", JSON.stringify(parsed.data));
      body.append("screenshot", payment);
      idCards.forEach((file, i) => body.append(`id_card_${i + 1}`, file));
      if (turnstileToken) body.append("turnstile", turnstileToken);
      const res = await fetch("/api/register", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setRegistered(parsed.data.team_name);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      // Turnstile tokens are single-use: get a fresh one for the next try.
      resetTurnstile();
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message, { duration: 6000 });
      if (message.toLowerCase().includes("team name")) {
        setNameStatus("taken");
        goTo(0);
        setErrors({ team_name: message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <FormPanel>
        <div ref={topRef} className="scroll-mt-20" />
        <SuccessState teamName={registered} leader={players[0]} />
      </FormPanel>
    );
  }

  return (
    <FormPanel>
      <Toaster position="top-center" />
      <div ref={topRef} className="scroll-mt-20" />
      <Stepper current={step} onSelect={(i) => i < step && goTo(i)} />

      <div className="mt-10">
        {step === 0 && (
          <TeamStep
            teamName={teamName}
            setTeamName={(value) => {
              setTeamName(value);
              setErrors({});
              if (!value.trim()) {
                nameCheckId.current++;
                setNameStatus("idle");
              }
            }}
            status={nameStatus}
            error={errors.team_name}
            college={college}
            setCollege={(value) => {
              setCollege(value);
              setErrors(({ college: _removed, ...rest }) => rest);
            }}
            collegeError={errors.college}
            onEnter={handleNext}
          />
        )}
        {step === 1 && (
          <PlayersStep players={players} errors={errors} onChange={updatePlayer} />
        )}
        {step === 2 && (
          <RulesStep
            players={players}
            rulesRead={rulesRead}
            onRulesRead={() => setRulesRead(true)}
            onConsent={(index, consent) => updatePlayer(index, { consent })}
          />
        )}
        {step === 3 && (
          <PaymentStep
            teamName={teamName}
            screenshot={screenshot}
            setScreenshot={(file) => {
              setScreenshot(file);
              setErrors({});
            }}
            transactionId={transactionId}
            setTransactionId={setTransactionId}
            error={errors.screenshot}
          />
        )}
        {step === 3 && needsTurnstile && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-neutral-800">Quick check that you&apos;re human *</p>
            {/* Cloudflare renders the widget here (about 300×65). */}
            <div ref={turnstileRef} className="min-h-[65px]" />
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-neutral-200 pt-6">
        {step > 0 ? (
          <button type="button" className={secondaryButton} onClick={() => goTo(step - 1)} disabled={submitting}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className={primaryButton}
            onClick={handleNext}
            disabled={(step === 0 && nameStatus === "checking") || (step === 2 && !(rulesRead && allConsented))}
          >
            {step === 2 ? "Agree and continue to payment" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            className={primaryButton}
            onClick={handleSubmit}
            disabled={submitting || (needsTurnstile && !turnstileToken)}
          >
            {submitting ? "Submitting…" : "Submit registration"}
          </button>
        )}
      </div>
    </FormPanel>
  );
}

/* ------------------------------------------------------------------ steps */

function Stepper({ current, onSelect }: { current: number; onSelect: (i: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              disabled={!done}
              className="group flex w-full flex-col gap-2 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "h-1 w-full rounded-full transition-colors",
                  done || active ? "bg-brand" : "bg-neutral-200",
                )}
              />
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium sm:text-sm",
                  active ? "text-neutral-800" : done ? "text-brand group-hover:underline" : "text-neutral-400",
                )}
              >
                {done ? <CheckIcon className="size-3.5" /> : <span className="font-mono">{index + 1}</span>}
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="section-title text-2xl">{title}</h2>
      {children && <p className="mt-1.5 text-sm text-neutral-500">{children}</p>}
    </div>
  );
}

function TeamStep({
  teamName,
  setTeamName,
  status,
  error,
  college,
  setCollege,
  collegeError,
  onEnter,
}: {
  teamName: string;
  setTeamName: (value: string) => void;
  status: NameStatus;
  error?: string;
  college: string;
  setCollege: (value: string) => void;
  collegeError?: string;
  onEnter: () => void;
}) {
  const hint = error ? (
    <span className="text-red-600">{error}</span>
  ) : status === "checking" ? (
    "Checking availability…"
  ) : status === "available" ? (
    <span className="text-emerald-700">Team name is available.</span>
  ) : status === "taken" ? (
    <span className="text-red-600">Team name already taken. Please choose another.</span>
  ) : (
    "2–32 characters. Names are not case-sensitive, so “Alpha” and “alpha” are the same team."
  );

  return (
    <>
      <StepHeading title="Team details">
        Choose a unique name for your squad and the college you represent.
        Player 1 on the next step is your team leader.
      </StepHeading>
      <Field label="Team name *" htmlFor="team_name" hint={hint}>
        <input
          id="team_name"
          autoFocus
          autoComplete="off"
          maxLength={32}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          className={cn(inputClassName, (error || status === "taken") && "border-red-400 focus:border-red-500 focus:ring-red-500")}
          placeholder="e.g. Baneshwor Bandits"
        />
      </Field>
      <Field
        label="College *"
        htmlFor="college"
        className="mt-5"
        hint={collegeError ? <span className="text-red-600">{collegeError}</span> : "Full name of the college all four players study at."}
      >
        <input
          id="college"
          autoComplete="organization"
          maxLength={120}
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          className={cn(inputClassName, collegeError && "ring-red-400 focus:ring-red-500")}
          placeholder="e.g. Global School of Science"
        />
      </Field>
    </>
  );
}

function PlayersStep({
  players,
  errors,
  onChange,
}: {
  players: PlayerDraft[];
  errors: Errors;
  onChange: (index: number, patch: Partial<PlayerDraft>) => void;
}) {
  return (
    <>
      <StepHeading title="Players">
        All four players are required. Use details exactly as they appear on
        the student ID card and in Free Fire.
      </StepHeading>
      <div className="space-y-4">
        {players.map((player, index) => (
          <PlayerCard
            key={index}
            index={index}
            player={player}
            errors={errors}
            onChange={(patch) => onChange(index, patch)}
          />
        ))}
      </div>
    </>
  );
}

function PlayerCard({
  index,
  player,
  errors,
  onChange,
}: {
  index: number;
  player: PlayerDraft;
  errors: Errors;
  onChange: (patch: Partial<PlayerDraft>) => void;
}) {
  const id = (field: string) => `p${index}_${field}`;
  const err = (field: keyof PlayerDraft) => errors[`players.${index}.${field}`];
  const input = (field: keyof PlayerDraft) =>
    cn(inputClassName, err(field) && "border-red-400 focus:border-red-500 focus:ring-red-500");
  const hint = (field: keyof PlayerDraft, fallback?: string) =>
    err(field) ? <span className="text-red-600">{err(field)}</span> : fallback;

  return (
    <fieldset className="rounded-xl border border-neutral-200 p-5">
      <legend className="flex items-center gap-2 px-1 text-sm font-medium text-neutral-800">
        <span className="flex size-6 items-center justify-center rounded-full border border-neutral-300 font-mono text-xs text-neutral-600">
          {index + 1}
        </span>
        Player {index + 1}
        {index === 0 && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
            Team leader
          </span>
        )}
      </legend>

      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Real name *" htmlFor={id("real_name")} hint={hint("real_name")}>
          <input id={id("real_name")} autoComplete="off" value={player.real_name} onChange={(e) => onChange({ real_name: e.target.value })} className={input("real_name")} placeholder="Full name" />
        </Field>
        <Field label="In-game name *" htmlFor={id("ign")} hint={hint("ign")}>
          <input id={id("ign")} autoComplete="off" value={player.ign} onChange={(e) => onChange({ ign: e.target.value })} className={input("ign")} placeholder="Free Fire nickname" />
        </Field>
        <Field label="Free Fire UID *" htmlFor={id("ff_uid")} hint={hint("ff_uid", "Profile → tap your avatar → copy UID")}>
          <input id={id("ff_uid")} inputMode="numeric" autoComplete="off" value={player.ff_uid} onChange={(e) => onChange({ ff_uid: e.target.value.replace(/\D/g, "") })} className={cn(input("ff_uid"), "font-mono")} placeholder="123456789" />
        </Field>
        <Field label="WhatsApp number *" htmlFor={id("whatsapp")} hint={hint("whatsapp", index === 0 ? "The organisers contact the team leader here." : undefined)}>
          <input id={id("whatsapp")} type="tel" inputMode="tel" autoComplete="off" value={player.whatsapp} onChange={(e) => onChange({ whatsapp: e.target.value })} className={input("whatsapp")} placeholder="98XXXXXXXX" />
        </Field>
        <Field label="Class *" hint={hint("grade")}>
          <Segmented
            name={id("grade")}
            options={GRADES.map((g) => ({ value: g, label: `Class ${g}` }))}
            value={player.grade}
            onChange={(grade) => onChange({ grade })}
            invalid={Boolean(err("grade"))}
          />
        </Field>
        <Field
          label="Student ID card *"
          htmlFor={id("idCard")}
          className="md:col-span-2"
          hint={hint("idCard", "A clear photo of the front of the college ID card, with the name readable.")}
        >
          <ImageUpload
            id={id("idCard")}
            file={player.idCard}
            onChange={(idCard) => onChange({ idCard })}
            invalid={Boolean(err("idCard"))}
          />
        </Field>
      </div>
    </fieldset>
  );
}

/** Photo picker with a thumbnail of the chosen image. */
function ImageUpload({
  id,
  file,
  onChange,
  invalid,
}: {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  invalid?: boolean;
}) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-xl bg-neutral-50 p-3 ring-1 ring-inset transition-colors hover:bg-neutral-100/70 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
        invalid ? "ring-red-400" : "ring-neutral-200",
      )}
    >
      <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <IdCardIcon className="size-7 text-neutral-300" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-medium text-neutral-800">{file ? "Change photo" : "Upload ID card photo"}</span>
        <span className="block truncate text-neutral-500">{file ? file.name : "JPG, PNG or WebP · take a photo or choose one"}</span>
      </span>
      <input
        id={id}
        type="file"
        accept={SCREENSHOT_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (!picked) return;
          if (!SCREENSHOT_TYPES.includes(picked.type)) {
            toast.error("Use a JPG, PNG or WebP image.");
            return;
          }
          if (picked.size > MAX_PICK_BYTES) {
            toast.error("That photo is over 15 MB. Try another.");
            return;
          }
          onChange(picked);
        }}
      />
    </label>
  );
}

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2" />
      <path d="M14 10h4M14 13h3" />
    </svg>
  );
}

function Segmented({
  name,
  options,
  value,
  onChange,
  invalid,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "flex rounded-md border bg-neutral-50 p-0.5",
        invalid ? "border-red-400" : "border-neutral-300",
      )}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex h-8 flex-1 cursor-pointer items-center justify-center rounded text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand",
              checked ? "bg-white font-medium text-brand shadow-sm ring-1 ring-neutral-200" : "text-neutral-600 hover:text-neutral-800",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

function RulesStep({
  players,
  rulesRead,
  onRulesRead,
  onConsent,
}: {
  players: PlayerDraft[];
  rulesRead: boolean;
  onRulesRead: () => void;
  onConsent: (index: number, consent: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Short screens might show the whole list without scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 8) onRulesRead();
  }, [onRulesRead]);

  return (
    <>
      <StepHeading title="Rules and consent">
        Every player must read the rules. Payment unlocks only after all four
        players accept the statement below.
      </StepHeading>

      <div className="relative rounded-xl border border-neutral-200">
        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) onRulesRead();
          }}
          className="max-h-[440px] overflow-y-auto px-5"
          tabIndex={0}
          aria-label="Tournament rules"
        >
          <RulesList />
        </div>
        {!rulesRead && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center rounded-b-xl bg-gradient-to-t from-white via-white/90 to-transparent pb-3">
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white shadow-sm">
              Scroll to the end to continue
            </span>
          </div>
        )}
      </div>

      <div className={cn("mt-6 space-y-3 transition-opacity", !rulesRead && "opacity-50")}>
        {players.map((player, index) => (
          <label
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 transition-colors",
              player.consent ? "border-brand/40 bg-brand/[0.03]" : "border-neutral-200",
              rulesRead ? "cursor-pointer" : "cursor-not-allowed",
            )}
          >
            <input
              type="checkbox"
              checked={player.consent}
              disabled={!rulesRead}
              onChange={(e) => onConsent(index, e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 accent-brand"
            />
            <span className="text-sm">
              <span className="font-medium text-neutral-800">
                Player {index + 1} · {player.real_name || "—"}{" "}
                <span className="font-normal text-neutral-500">({player.ign || "IGN"})</span>
              </span>
              <span className="mt-1 block leading-relaxed text-neutral-600">
                “{CONSENT_STATEMENT}”
              </span>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

function PaymentStep({
  teamName,
  screenshot,
  setScreenshot,
  transactionId,
  setTransactionId,
  error,
}: {
  teamName: string;
  screenshot: File | null;
  setScreenshot: (file: File | null) => void;
  transactionId: string;
  setTransactionId: (value: string) => void;
  error?: string;
}) {
  const preview = useMemo(() => (screenshot ? URL.createObjectURL(screenshot) : null), [screenshot]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <>
      <StepHeading title="Payment">
        Pay the NPR {EVENT.feeNpr} team fee and upload the screenshot. The fee
        is non-refundable once your registration is confirmed.
      </StepHeading>

      <div className="flex flex-col items-start gap-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5 md:flex-row md:items-center">
        <div className="flex shrink-0 flex-col items-center self-center">
          <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            {EVENT.paymentQr ? (
              <Image src={EVENT.paymentQr} alt="Payment QR code" width={200} height={200} className="rounded-md" />
            ) : (
              <div className="flex size-[200px] items-center justify-center rounded-md border border-dashed border-neutral-300 px-6 text-center text-xs text-neutral-500">
                Payment QR will appear here
              </div>
            )}
          </div>
          <p className="mt-3 text-center font-mono text-xs text-neutral-500">
            NPR {EVENT.feeNpr} per team
          </p>
          {EVENT.paymentPayee && (
            <p className="mt-3 max-w-[226px] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs leading-relaxed text-amber-900">
              <span className="font-medium">Note:</span> this QR is in the name of{" "}
              <span className="font-medium">{EVENT.paymentPayee}</span> ({EVENT.paymentWallet}{" "}
              <span className="font-mono">{EVENT.paymentWalletId}</span>). Check
              this name before you pay.
            </p>
          )}
        </div>
        <ol className="flex-1 space-y-3">
          {[
            `Scan the QR with the ${EVENT.paymentWallet} app, or send to ${EVENT.paymentWallet} ID ${EVENT.paymentWalletId}.`,
            `Pay exactly NPR ${EVENT.feeNpr}. Put your team name “${teamName.trim()}” in the remarks.`,
            "Take a screenshot showing the amount and transaction ID.",
            "Upload it below and submit.",
          ].map((text, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs text-white">
                {index + 1}
              </span>
              <p className="text-sm text-neutral-600">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
        <div className="space-y-4">
          <Field
            label="Payment screenshot * (JPG, PNG or WebP)"
            htmlFor="screenshot"
            hint={error ? <span className="text-red-600">{error}</span> : screenshot ? `${screenshot.name} (${(screenshot.size / 1024).toFixed(0)} KB)` : undefined}
          >
            <input
              id="screenshot"
              type="file"
              accept={SCREENSHOT_TYPES.join(",")}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && !SCREENSHOT_TYPES.includes(file.type)) {
                  toast.error("Use a JPG, PNG or WebP image.");
                  e.target.value = "";
                  return;
                }
                if (file && file.size > MAX_PICK_BYTES) {
                  toast.error("That image is over 15 MB. Try another.");
                  e.target.value = "";
                  return;
                }
                setScreenshot(file);
              }}
              className={fileInputClassName}
            />
          </Field>
          <Field label="Transaction ID (optional)" htmlFor="transaction_id" hint="Helps the organisers match your payment faster.">
            <input
              id="transaction_id"
              autoComplete="off"
              maxLength={60}
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className={cn(inputClassName, "font-mono")}
            />
          </Field>
        </div>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="Payment screenshot preview" className="max-h-64 w-full rounded-lg border border-neutral-200 object-contain" />
        )}
      </div>
    </>
  );
}

function SuccessState({ teamName, leader }: { teamName: string; leader: PlayerDraft }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
        <CheckIcon className="size-7" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-800">
        {teamName} is registered
      </h2>
      <p className="mt-3 max-w-md text-pretty text-neutral-500">
        Your registration is <strong className="font-medium text-neutral-800">pending verification</strong>.
        Once the organisers confirm the payment, they will contact your team
        leader {leader.real_name} on WhatsApp ({leader.whatsapp}).
      </p>
      <Link href="/" className={cn(buttonClassName({ variant: "secondary" }), "mt-8")}>
        Back to home
      </Link>
    </div>
  );
}
