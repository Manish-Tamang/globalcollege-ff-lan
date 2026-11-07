"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/app/lib/supabase/browser";

export type AdminAuthProps = {
  admin: User;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
};

/** True when the signed-in user has a row in public.admins. */
export async function isAdminUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}

/**
 * Higher-order component that only renders `Component` for a signed-in
 * admin. Everyone else is sent to /admin/login and never sees the page.
 *
 * This is the UI gate. The data itself is protected by row level security
 * in supabase/schema.sql, so even a bypassed HOC returns no registrations.
 */
export function withAdminAuth<P extends object>(
  Component: ComponentType<P & AdminAuthProps>,
) {
  function AdminOnly(props: P) {
    const router = useRouter();
    const [admin, setAdmin] = useState<User | null>(null);
    const supabase = getBrowserSupabase();

    useEffect(() => {
      if (!supabase) {
        router.replace("/admin/login?error=config");
        return;
      }

      let active = true;

      (async () => {
        // getUser() validates the session with Supabase instead of trusting
        // whatever is in localStorage.
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error || !data.user) {
          router.replace("/admin/login");
          return;
        }
        if (!(await isAdminUser(supabase, data.user.id))) {
          await supabase.auth.signOut();
          if (active) router.replace("/admin/login?error=forbidden");
          return;
        }
        if (active) setAdmin(data.user);
      })();

      // Signing out in another tab, or the session expiring, locks this one.
      const { data: listener } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          setAdmin(null);
          router.replace("/admin/login");
        }
      });

      return () => {
        active = false;
        listener.subscription.unsubscribe();
      };
    }, [router, supabase]);

    const signOut = useCallback(async () => {
      await supabase?.auth.signOut();
    }, [supabase]);

    if (!admin || !supabase) return <AdminGateLoader />;

    return (
      <Component {...props} admin={admin} supabase={supabase} signOut={signOut} />
    );
  }

  AdminOnly.displayName = `withAdminAuth(${Component.displayName || Component.name || "Component"})`;
  return AdminOnly;
}

function AdminGateLoader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">
      <div className="sky pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
      <div className="relative flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm shadow-black/5 ring-1 ring-black/5">
        <span className="size-4 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-500" />
        Checking access…
      </div>
    </div>
  );
}
