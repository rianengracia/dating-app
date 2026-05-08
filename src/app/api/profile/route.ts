import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";

export const runtime = "nodejs";

const patchSchema = z.object({
  displayName: z.string().trim().min(2).max(32),
  bio: z.string().trim().min(1).max(280),
});

export async function GET() {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;
  return NextResponse.json({ ok: true, user: auth.user });
}

export async function PATCH(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data: { displayName: parsed.data.displayName, bio: parsed.data.bio },
    select: { displayName: true, bio: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
