import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const me = auth.user;

  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!match) {
    return NextResponse.json({ ok: false, error: "Match not found." }, { status: 404 });
  }
  if (match.userAId !== me.id && match.userBId !== me.id) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  // Cascade removes messages.
  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
