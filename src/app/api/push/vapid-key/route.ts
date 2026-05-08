import { NextResponse } from "next/server";
import { getPublicKey } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  const key = getPublicKey();
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Push is not configured on the server." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true, publicKey: key });
}
