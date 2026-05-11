import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { savePhoto, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

type FieldErrors = Record<string, string>;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form payload." }, { status: 400 });
  }

  const ageRaw = form.get("age");
  const parsed = registerSchema.safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
    displayName: String(form.get("displayName") ?? ""),
    age: ageRaw === null || ageRaw === "" ? undefined : Number(ageRaw),
    bio: String(form.get("bio") ?? ""),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: zodToFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json(
      { ok: false, errors: { photo: "Profile photo is required." } },
      { status: 400 }
    );
  }

  let photoUrl: string;
  try {
    photoUrl = await savePhoto(photo);
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ ok: false, errors: { photo: err.message } }, { status: 400 });
    }
    console.error("[register] photo upload failed:", err);
    return NextResponse.json({ ok: false, error: "Photo upload failed." }, { status: 500 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        displayName: parsed.data.displayName,
        age: parsed.data.age,
        bio: parsed.data.bio,
        photoUrl,
      },
      select: { id: true, email: true },
    });

    const token = await signSession({ sub: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, redirect: "/discover" });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { ok: false, errors: { email: "An account with this email already exists." } },
        { status: 409 }
      );
    }
    console.error("register failed", err);
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}

function zodToFieldErrors(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
