import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

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

  const { url } = await put(`uploads/${name}`, file, {
    access: "public",
    contentType: file.type,
  });
  return url;
}
