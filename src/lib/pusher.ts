import Pusher from "pusher";

const globalForPusher = globalThis as unknown as {
  pusher?: Pusher;
};

export function getPusher(): Pusher {
  if (globalForPusher.pusher) return globalForPusher.pusher;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    throw new Error("Pusher env vars missing: PUSHER_APP_ID/KEY/SECRET/CLUSTER.");
  }
  const instance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  if (process.env.NODE_ENV !== "production") globalForPusher.pusher = instance;
  return instance;
}

export function matchChannel(matchId: string): string {
  return `presence-match-${matchId}`;
}
