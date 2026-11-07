"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Dialog, DialogPanel, DialogTitle, Switch } from "@headlessui/react";
import { withAdminAuth, type AdminAuthProps } from "../lib/auth/with-admin-auth";
import { buttonClassName } from "../components/ui/button";
import { inputClassName } from "../components/ui/form";
import { CloseIcon } from "../components/icons/ui-icons";
import { cn } from "../lib/utils";
import { EVENT } from "../data/event";
import type { PlayerRow, RegistrationStatus, TeamRow } from "../lib/types";

const FILTERS = ["all", "pending", "verified", "rejected"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

function AdminDashboard({ admin, supabase, signOut }: AdminAuthProps) {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [teamsRes, settingsRes] = await Promise.all([
      supabase
        .from("teams")
        .select("*, players(*)")
        .order("created_at", { ascending: false }),
      supabase.from("settings").select("registration_open").eq("id", true).maybeSingle(),
    ]);
    return { teamsRes, settingsRes };
  }, [supabase]);

  const apply = useCallback(
    ({ teamsRes, settingsRes }: Awaited<ReturnType<typeof fetchData>>) => {
      if (teamsRes.error) toast.error(`Could not load teams: ${teamsRes.error.message}`);
      else
        setTeams(
          (teamsRes.data as TeamRow[]).map((t) => ({
            ...t,
            players: [...t.players].sort((a, b) => a.slot - b.slot),
          })),
        );
      setRegistrationOpen(settingsRes.data?.registration_open ?? null);
      setLoading(false);
    },
    [],
  );

  const load = async () => {
    setLoading(true);
    apply(await fetchData());
  };

  useEffect(() => {
    let active = true;
    fetchData().then((result) => active && apply(result));
    return () => {
      active = false;
    };
  }, [fetchData, apply]);

  const counts = useMemo(
    () => ({
      all: teams.length,
      pending: teams.filter((t) => t.status === "pending").length,
      verified: teams.filter((t) => t.status === "verified").length,
      rejected: teams.filter((t) => t.status === "rejected").length,
    }),
    [teams],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams.filter((team) => {
      if (filter !== "all" && team.status !== filter) return false;
      if (!q) return true;
      const haystack = [
        team.team_name,
        team.college,
        team.transaction_id ?? "",
        ...team.players.flatMap((p) => [p.real_name, p.ign, p.ff_uid, p.whatsapp]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [teams, filter, query]);

  const selected = teams.find((t) => t.id === selectedId) ?? null;

  async function toggleRegistration(open: boolean) {
    setRegistrationOpen(open);
    const { error } = await supabase.from("settings").update({ registration_open: open }).eq("id", true);
    if (error) {
      setRegistrationOpen(!open);
      toast.error(error.message);
    } else toast.success(open ? "Registration opened" : "Registration closed");
  }

  async function updateTeam(id: string, patch: Partial<Pick<TeamRow, "status" | "admin_note">>) {
    const { error } = await supabase.from("teams").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    return true;
  }

  async function deleteTeam(team: TeamRow) {
    const { error } = await supabase.from("teams").delete().eq("id", team.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await Promise.all([
      supabase.storage.from("payment-proofs").remove([team.payment_screenshot_path]),
      supabase.storage.from("id-cards").remove(team.players.map((p) => p.id_card_path)),
    ]);
    setTeams((prev) => prev.filter((t) => t.id !== team.id));
    setSelectedId(null);
    toast.success(`Deleted ${team.team_name}`);
  }

  const collected = counts.verified * EVENT.feeNpr;

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNav email={admin.email ?? ""} onSignOut={signOut} />

      {/* Header band: same sky as the homepage hero */}
      <section className="relative overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true">
          <div className="sky absolute inset-0" />
          <div className="sky-dots absolute inset-0" />
        </div>
        <div className="frame px-4 pb-10 pt-32 sm:px-8 sm:pt-36">
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm shadow-black/5 ring-1 ring-black/5">
                <span className={cn("size-1.5 rounded-full", registrationOpen ? "bg-emerald-500" : "bg-neutral-400")} aria-hidden="true" />
                Registration {registrationOpen === null ? "…" : registrationOpen ? "open" : "closed"}
              </p>
              <h1 className="section-title mt-5 text-4xl leading-[1.15] sm:text-5xl">
                Team <span className="hl">registrations</span>
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-700">
                Check payment screenshots, verify squads, message team leaders
                on WhatsApp and export the player list.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl bg-white px-4 text-[15px] font-medium text-neutral-800 shadow-sm shadow-black/5 ring-1 ring-black/[0.08]">
                Accepting teams
                <Switch
                  checked={Boolean(registrationOpen)}
                  disabled={registrationOpen === null}
                  onChange={toggleRegistration}
                  className="group relative inline-flex h-6 w-10 items-center rounded-full bg-neutral-200 transition-colors data-[checked]:bg-brand-500 data-[disabled]:opacity-50"
                >
                  <span className="size-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform group-data-[checked]:translate-x-[18px]" />
                </Switch>
              </label>
              <button type="button" onClick={() => void load()} className={buttonClassName({ variant: "secondary" })}>
                <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
                Refresh
              </button>
              <button type="button" onClick={() => exportCsv(teams)} disabled={teams.length === 0} className={buttonClassName()}>
                <DownloadIcon className="size-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        <div className="frame" aria-hidden="true">
          <div className="dots-x mx-2" />
        </div>
      </section>

      {/* Stats, split by dotted rules like the homepage */}
      <section className="px-4">
        <dl className="frame grid grid-cols-2 lg:grid-cols-5">
          <Stat index={0} label="Teams" value={counts.all} />
          <Stat index={1} label="Pending review" value={counts.pending} dot="bg-amber-400" />
          <Stat index={2} label="Verified" value={counts.verified} dot="bg-emerald-500" />
          <Stat index={3} label="Rejected" value={counts.rejected} dot="bg-red-500" />
          <Stat index={4} label="Collected" value={`NPR ${collected.toLocaleString("en-IN")}`} className="col-span-2 lg:col-span-1" />
        </dl>
        <div className="frame" aria-hidden="true">
          <div className="dots-x mx-2" />
        </div>
      </section>

      <section className="px-4">
        <div className="frame px-4 py-10 sm:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-fit gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 text-sm font-medium capitalize transition-all",
                    filter === f
                      ? "bg-white text-neutral-800 shadow-sm shadow-black/5 ring-1 ring-black/5"
                      : "text-neutral-500 hover:text-neutral-800",
                  )}
                >
                  {f}
                  <span className={cn("tabular-nums", filter === f ? "text-brand-600" : "text-neutral-400")}>{counts[f]}</span>
                </button>
              ))}
            </div>
            <div className="relative md:w-80">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search team, player, UID, phone"
                className={cn(inputClassName, "pl-9")}
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/5">
            {/* Desktop table */}
            <table className="hidden w-full text-left text-[15px] md:table">
              <thead className="text-sm text-neutral-500">
                <tr className="border-b border-neutral-100">
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-5 py-3 font-medium">Leader</th>
                  <th className="px-5 py-3 font-medium">Players</th>
                  <th className="px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visible.map((team) => {
                  const leader = team.players[0];
                  return (
                    <tr
                      key={team.id}
                      onClick={() => setSelectedId(team.id)}
                      className="cursor-pointer transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <TeamAvatar name={team.team_name} />
                          <span>
                            <span className="block font-medium text-neutral-800">{team.team_name}</span>
                            <span className="block text-sm text-neutral-500">{team.college}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-neutral-800">{leader?.real_name}</div>
                        <div className="text-sm tabular-nums text-neutral-500">{leader?.whatsapp}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {team.players.map((p) => (
                            <span key={p.id} className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                              {p.ign}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-neutral-500">{formatDate(team.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <StatusBadge status={team.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Phone list */}
            <ul className="divide-y divide-neutral-100 md:hidden">
              {visible.map((team) => (
                <li key={team.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(team.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-neutral-50"
                  >
                    <TeamAvatar name={team.team_name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-neutral-800">{team.team_name}</span>
                      <span className="block truncate text-sm text-neutral-500">
                        {team.college} · {formatDate(team.created_at)}
                      </span>
                    </span>
                    <StatusBadge status={team.status} />
                  </button>
                </li>
              ))}
            </ul>

            {loading && teams.length === 0 && <LoadingRows />}
            {!loading && visible.length === 0 && (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <p className="font-medium text-neutral-800">
                  {teams.length === 0 ? "No registrations yet" : "No teams match"}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {teams.length === 0
                    ? "Teams show up here as soon as they submit the form."
                    : "Try another filter or search term."}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="frame" aria-hidden="true">
          <div className="dots-x mx-2" />
        </div>
      </section>

      <TeamDialog
        team={selected}
        supabase={supabase}
        onClose={() => setSelectedId(null)}
        onUpdate={updateTeam}
        onDelete={deleteTeam}
      />
    </div>
  );
}

export default withAdminAuth(AdminDashboard);

/* ------------------------------------------------------------ pieces */

function AdminNav({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <nav className="fixed inset-x-4 top-4 z-40 mx-auto max-w-3xl md:top-6">
      <div className="flex items-center justify-between rounded-2xl bg-white/90 p-2 shadow-sm shadow-black/5 ring-1 ring-black/5 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 pl-1 md:pl-2">
          <Image src="/gss-it-club-logo.png" alt="" width={64} height={64} className="size-7 rounded-full" />
          <span className="text-[17px] font-semibold tracking-tight text-neutral-800">{EVENT.organiser}</span>
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100">Admin</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[200px] truncate text-sm text-neutral-500 sm:block">{email}</span>
          <button type="button" onClick={onSignOut} className={buttonClassName({ variant: "secondary", size: "sm" })}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

function Stat({
  index,
  label,
  value,
  dot,
  className,
}: {
  index: number;
  label: string;
  value: number | string;
  dot?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex flex-col gap-1 px-6 py-7 sm:px-8", className)}>
      {/* Dotted rule between cells; the 2-column phone grid skips the left column. */}
      {index > 0 && (
        <span
          className={cn("dots-y absolute inset-y-4 left-0", index % 2 === 0 ? "hidden lg:block" : "")}
          aria-hidden="true"
        />
      )}
      <dt className="flex items-center gap-2 text-sm text-neutral-500">
        {dot && <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />}
        {label}
      </dt>
      <dd className="text-3xl font-semibold tracking-tight tabular-nums text-neutral-800">{value}</dd>
    </div>
  );
}

const STATUS_DOTS: Record<RegistrationStatus, string> = {
  pending: "bg-amber-400",
  verified: "bg-emerald-500",
  rejected: "bg-red-500",
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset", STATUS_STYLES[status])}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOTS[status])} aria-hidden="true" />
      {status}
    </span>
  );
}

function TeamAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold uppercase text-brand-700 ring-1 ring-brand-100">
      {name.trim().slice(0, 2)}
    </span>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-neutral-100" aria-label="Loading teams">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <span className="size-9 animate-pulse rounded-full bg-neutral-100" />
          <span className="h-3 w-40 animate-pulse rounded bg-neutral-100" />
          <span className="ml-auto h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function TeamDialog({
  team,
  supabase,
  onClose,
  onUpdate,
  onDelete,
}: {
  team: TeamRow | null;
  supabase: AdminAuthProps["supabase"];
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Pick<TeamRow, "status" | "admin_note">>) => Promise<boolean>;
  onDelete: (team: TeamRow) => Promise<void>;
}) {
  return (
    <Dialog open={Boolean(team)} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-neutral-900/20 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="fixed inset-0 flex justify-end p-0 sm:p-3">
        <DialogPanel className="flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl shadow-black/10 ring-1 ring-black/5 sm:rounded-2xl">
          {team && (
            // Keyed so the note and screenshot reset when another team opens.
            <TeamDetails
              key={team.id}
              team={team}
              supabase={supabase}
              onClose={onClose}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function TeamDetails({
  team,
  supabase,
  onClose,
  onUpdate,
  onDelete,
}: {
  team: TeamRow;
  supabase: AdminAuthProps["supabase"];
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Pick<TeamRow, "status" | "admin_note">>) => Promise<boolean>;
  onDelete: (team: TeamRow) => Promise<void>;
}) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [idCardUrls, setIdCardUrls] = useState<Record<string, string>>({});
  const [note, setNote] = useState(team.admin_note ?? "");
  const [busy, setBusy] = useState(false);
  const path = team.payment_screenshot_path;
  const idCardPaths = team.players.map((p) => p.id_card_path).join("|");

  // Both buckets are private: show short-lived signed links.
  useEffect(() => {
    let active = true;
    supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60 * 10)
      .then(({ data }) => active && setScreenshotUrl(data?.signedUrl ?? null));
    supabase.storage
      .from("id-cards")
      .createSignedUrls(idCardPaths.split("|").filter(Boolean), 60 * 10)
      .then(({ data }) => {
        if (!active || !data) return;
        const urls: Record<string, string> = {};
        for (const d of data) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
        setIdCardUrls(urls);
      });
    return () => {
      active = false;
    };
  }, [path, idCardPaths, supabase]);

  async function setStatus(status: RegistrationStatus) {
    setBusy(true);
    const ok = await onUpdate(team.id, { status, admin_note: note.trim() || null });
    setBusy(false);
    if (ok) toast.success(`${team.team_name} marked ${status}`);
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white/90 px-6 py-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <TeamAvatar name={team.team_name} />
          <div>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-neutral-800">
            {team.team_name} <StatusBadge status={team.status} />
          </DialogTitle>
          <p className="mt-0.5 text-sm text-neutral-500">
            {team.college} · Registered {formatDate(team.created_at)}
            {team.transaction_id && (
              <>
                {" · "}Txn <span className="font-mono">{team.transaction_id}</span>
              </>
            )}
          </p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-[10px] p-2 transition-colors hover:bg-neutral-100">
          <CloseIcon className="size-5 text-neutral-600" />
        </button>
      </div>

      <div className="dots-x mx-6" aria-hidden="true" />

      <div className="space-y-10 px-6 py-8">
        <section>
          <h3 className="text-base font-semibold tracking-tight text-neutral-800">Players</h3>
          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm shadow-black/5 ring-1 ring-black/5">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-neutral-500">
                <tr className="border-b border-neutral-100">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Name / IGN</th>
                  <th className="px-3 py-2 font-medium">UID</th>
                  <th className="px-3 py-2 font-medium">Class</th>
                  <th className="px-3 py-2 font-medium">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {team.players.map((p) => (
                  <PlayerTableRow key={p.id} player={p} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-neutral-500">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            All four players accepted: “{team.consent_statement}”
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold tracking-tight text-neutral-800">Student ID cards</h3>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {team.players.map((p) => {
              const url = idCardUrls[p.id_card_path];
              return (
                <li key={p.id}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-[3/2] overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-black/5"
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
                      <img src={url} alt={`ID card of ${p.real_name}`} className="size-full object-cover transition-transform hover:scale-[1.02]" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-sm text-neutral-400">Loading…</span>
                    )}
                  </a>
                  <p className="mt-2 truncate text-sm text-neutral-700">
                    <span className="text-neutral-400">{p.slot}.</span> {p.real_name}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold tracking-tight text-neutral-800">Payment screenshot</h3>
            <span className="text-sm text-neutral-500">Expected NPR {EVENT.feeNpr}</span>
          </div>
          <div className="mt-4 rounded-xl bg-neutral-50 p-3 ring-1 ring-black/5">
            {screenshotUrl ? (
              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img src={screenshotUrl} alt={`Payment from ${team.team_name}`} className="mx-auto max-h-[480px] rounded-md object-contain" />
              </a>
            ) : (
              <p className="py-10 text-center text-sm text-neutral-500">Loading screenshot…</p>
            )}
          </div>
        </section>

        <section>
          <label htmlFor="admin_note" className="text-base font-semibold tracking-tight text-neutral-800">
            Admin note
          </label>
          <textarea
            id="admin_note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Amount short by NPR 100, asked leader to resend"
            className={cn(inputClassName, "mt-3")}
          />
        </section>
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-white/90 px-6 py-4 backdrop-blur">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`Delete ${team.team_name} and all its players? This cannot be undone.`)) void onDelete(team);
          }}
          className="h-11 rounded-xl px-3 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          Delete team
        </button>
        <div className="flex flex-wrap gap-2">
          {team.status !== "pending" && (
            <button type="button" disabled={busy} onClick={() => setStatus("pending")} className={buttonClassName({ variant: "secondary" })}>
              Mark pending
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => setStatus("rejected")} className={buttonClassName({ variant: "danger" })}>
            Reject
          </button>
          <button type="button" disabled={busy} onClick={() => setStatus("verified")} className={buttonClassName()}>
            Verify payment
          </button>
        </div>
      </div>
    </>
  );
}

function PlayerTableRow({ player }: { player: PlayerRow }) {
  return (
    <tr>
      <td className="px-3 py-2 align-top font-mono text-xs text-neutral-400">
        {player.slot}
        {player.is_captain && <span className="ml-1 rounded bg-brand-50 px-1 text-[10px] font-sans font-medium text-brand-700">Leader</span>}
      </td>
      <td className="px-3 py-2 align-top">
        <div className="text-neutral-800">{player.real_name}</div>
        <div className="text-xs text-neutral-500">{player.ign}</div>
      </td>
      <td className="px-3 py-2 align-top font-mono text-xs text-neutral-700">{player.ff_uid}</td>
      <td className="whitespace-nowrap px-3 py-2 align-top text-neutral-700">
        Class {player.grade}
      </td>
      <td className="px-3 py-2 align-top">
        <a href={whatsappLink(player.whatsapp)} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-brand-600 underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
          {player.whatsapp}
        </a>
      </td>
    </tr>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 15V3" />
      <path d="m7 10 5 5 5-5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* ------------------------------------------------------------ utils */

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `977${digits}` : digits}`;
}

function exportCsv(teams: TeamRow[]) {
  const header = [
    "Team", "College", "Status", "Registered", "Transaction ID", "Slot", "Leader",
    "Real name", "IGN", "UID", "Class", "WhatsApp",
  ];
  const rows = teams.flatMap((t) =>
    t.players.map((p) => [
      t.team_name, t.college, t.status, t.created_at, t.transaction_id ?? "", p.slot,
      p.is_captain ? "yes" : "", p.real_name, p.ign, p.ff_uid, p.grade,
      p.whatsapp,
    ]),
  );
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Stop spreadsheet apps from running cells as formulas.
          const text = String(cell);
          const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `ff-lan-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
