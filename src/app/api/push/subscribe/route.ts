import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";

export const runtime = "nodejs";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.union([z.number(), z.null()]).optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }
  const parsed = subscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid subscription." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { pushSubscription: parsed.data },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { pushSubscription: null as unknown as never },
  });
  return NextResponse.json({ ok: true });
}
