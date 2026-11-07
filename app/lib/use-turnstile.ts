"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function getTurnstile(): Turnstile | undefined {
  return (window as unknown as { turnstile?: Turnstile }).turnstile;
}

/** Loads the Turnstile script once per page. */
function loadScript(): Promise<void> {
  if (getTurnstile()) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")), { once: true });
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile challenge rendered into `containerRef` while `enabled`.
 * `token` is set once the visitor passes. Tokens are single-use, so call
 * `reset` after every submit attempt.
 */
export function useTurnstile(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !TURNSTILE_SITE_KEY) return;
    let cancelled = false;

    loadScript()
      .then(() => {
        const turnstile = getTurnstile();
        if (cancelled || !turnstile || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light",
          callback: (value: string) => setToken(value),
          "error-callback": () => setToken(null),
          "expired-callback": () => setToken(null),
        });
      })
      .catch(() => {
        /* The submit button explains that verification is required. */
      });

    return () => {
      cancelled = true;
      const turnstile = getTurnstile();
      if (widgetIdRef.current && turnstile) turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
      setToken(null);
    };
  }, [enabled]);

  const reset = useCallback(() => {
    setToken(null);
    const turnstile = getTurnstile();
    if (widgetIdRef.current && turnstile) turnstile.reset(widgetIdRef.current);
  }, []);

  return { containerRef, token, reset };
}
