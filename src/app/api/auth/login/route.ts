import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Credentials rejected." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "Credentials rejected." }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Credentials rejected." }, { status: 401 });
  }

  const token = await signSession({ sub: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, redirect: "/discover" });
}
