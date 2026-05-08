import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";
import { haversineKm } from "@/lib/distance";

export const runtime = "nodejs";

export type DiscoverCandidate = {
  id: string;
  displayName: string;
  age: number;
  bio: string;
  photoUrl: string;
  distanceKm: number | null;
};

const PAGE_SIZE = 20;

function intParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function GET(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const minAge = Math.max(18, intParam(url.searchParams.get("minAge"), 18));
  const maxAge = Math.min(99, intParam(url.searchParams.get("maxAge"), 99));
  const maxKmRaw = url.searchParams.get("maxKm");
  const maxKm = maxKmRaw === null || maxKmRaw === "" ? null : intParam(maxKmRaw, 100);

  const me = auth.user;

  const [swipedRows, matchesA, matchesB] = await Promise.all([
    prisma.swipe.findMany({ where: { swiperId: me.id }, select: { targetId: true } }),
    prisma.match.findMany({ where: { userAId: me.id }, select: { userBId: true } }),
    prisma.match.findMany({ where: { userBId: me.id }, select: { userAId: true } }),
  ]);

  const excluded = new Set<string>([me.id]);
  for (const s of swipedRows) excluded.add(s.targetId);
  for (const m of matchesA) excluded.add(m.userBId);
  for (const m of matchesB) excluded.add(m.userAId);

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excluded) },
      age: { gte: minAge, lte: maxAge },
    },
    select: {
      id: true,
      displayName: true,
      age: true,
      bio: true,
      photoUrl: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const myLat = me.latitude;
  const myLon = me.longitude;
  const haveLocation = typeof myLat === "number" && typeof myLon === "number";

  const withDistance: DiscoverCandidate[] = candidates.map((c) => {
    const distanceKm =
      haveLocation && typeof c.latitude === "number" && typeof c.longitude === "number"
        ? Math.round(haversineKm(myLat, myLon, c.latitude, c.longitude))
        : null;
    return {
      id: c.id,
      displayName: c.displayName,
      age: c.age,
      bio: c.bio,
      photoUrl: c.photoUrl,
      distanceKm,
    };
  });

  const filtered =
    maxKm !== null
      ? withDistance.filter((c) => c.distanceKm !== null && c.distanceKm <= maxKm)
      : withDistance;

  return NextResponse.json({
    ok: true,
    candidates: filtered.slice(0, PAGE_SIZE),
    filters: { minAge, maxAge, maxKm },
  });
}
