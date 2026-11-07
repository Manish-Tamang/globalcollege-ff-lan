import "server-only";

/**
 * Checks a Turnstile token with Cloudflare. Without TURNSTILE_SECRET_KEY
 * (local dev before keys are added) verification is skipped.
 */
export async function verifyTurnstile(token: string | null, remoteIp?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY is not set; skipping bot check.");
    return true;
  }
  if (!token) return false;

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("turnstile verify failed", error);
    return false;
  }
}
