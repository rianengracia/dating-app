import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserApi } from "@/lib/auth-server";
import { savePhoto, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.response) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form." }, { status: 400 });
  }

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ ok: false, error: "No file uploaded." }, { status: 400 });
  }

  let photoUrl: string;
  try {
    photoUrl = await savePhoto(photo);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Upload failed." }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { photoUrl },
  });

  return NextResponse.json({ ok: true, photoUrl });
}
