import webpush from "web-push";

let configured = false;

export function getPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@truematch.local";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPush(
  subscription: unknown,
  payload: PushPayload
): Promise<{ ok: true } | { ok: false; gone: boolean }> {
  if (!ensureConfigured()) return { ok: false, gone: false };
  if (!subscription || typeof subscription !== "object") return { ok: false, gone: true };
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    return { ok: false, gone: status === 404 || status === 410 };
  }
}
