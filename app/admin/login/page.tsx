"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Field, inputClassName } from "../../components/ui/form";
import { buttonClassName } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { getBrowserSupabase } from "../../lib/supabase/browser";
import { isAdminUser } from "../../lib/auth/with-admin-auth";
import { EVENT } from "../../data/event";

const ERRORS: Record<string, string> = {
  forbidden: "This account is not an admin.",
  config: "Supabase is not configured yet. Add the env vars first.",
};

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}

function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(ERRORS[params.get("error") ?? ""] ?? null);
  const [loading, setLoading] = useState(false);
  const supabase = getBrowserSupabase();

  // Already signed in as an admin? Skip the form.
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (active && data.user && (await isAdminUser(supabase, data.user.id))) {
        router.replace("/admin");
      }
    });
    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(ERRORS.config);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError || !data.user) {
      setError("Wrong email or password.");
      setLoading(false);
      return;
    }
    if (!(await isAdminUser(supabase, data.user.id))) {
      await supabase.auth.signOut();
      setError(ERRORS.forbidden);
      setLoading(false);
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden="true">
        <div className="sky absolute inset-0" />
        <div className="sky-dots absolute inset-0" />
      </div>

      <div className="frame flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <Link href="/" className="relative flex items-center gap-2">
          <Image src="/gss-it-club-logo.png" alt="" width={64} height={64} className="size-8 rounded-full" />
          <span className="text-xl font-semibold tracking-tight text-neutral-800">{EVENT.organiser}</span>
        </Link>

        <div className="relative mt-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm shadow-black/5 ring-1 ring-black/5 sm:p-8">
          <h1 className="section-title text-2xl">Admin sign in</h1>
          <p className="mt-2 text-[15px] text-neutral-500">Only organisers can open the dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} />
            </Field>
            <Field label="Password" htmlFor="password">
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClassName} />
            </Field>
            {error && (
              <p role="alert" className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className={cn(buttonClassName(), "w-full")}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <Link href="/" className="relative mt-6 text-sm text-neutral-500 transition-colors hover:text-neutral-800">
          Back to the tournament site
        </Link>
      </div>
    </main>
  );
}
