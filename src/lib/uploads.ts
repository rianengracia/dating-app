import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export class UploadError extends Error {}

export async function savePhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("Photo must be JPEG, PNG, or WebP.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Photo must be 5 MB or smaller.");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buffer);

  return `/uploads/${name}`;
}
