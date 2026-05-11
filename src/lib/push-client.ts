"use client";

import { pushService } from "@/services/pushService";

export type PushPermissionState = "unknown" | "default" | "granted" | "denied" | "unsupported";

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === "undefined") return "unknown";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermissionState;
}

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export async function ensurePushSubscription(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (getPushPermissionState() === "unsupported") {
    return { ok: false, error: "Push is not supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted." };
  }

  let publicKey: string;
  try {
    const data = await pushService.getPublicKey();
    publicKey = data.publicKey;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error && err.message ? err.message : "Push is not configured.",
    };
  }

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(publicKey),
    });
  }

  try {
    await pushService.subscribe(subscription.toJSON());
  } catch {
    return { ok: false, error: "Could not register subscription." };
  }
  return { ok: true };
}
