"use client";

import { useCallback, useState } from "react";
import { profileService, type ProfileUpdate } from "@/services/profileService";
import { ApiError } from "@/services/http";

type Message = { kind: "ok" | "err"; text: string };

export function useProfile() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const update = useCallback(async (patch: ProfileUpdate): Promise<boolean> => {
    setBusy(true);
    setMessage(null);
    try {
      await profileService.update(patch);
      setMessage({ kind: "ok", text: "Profile updated." });
      return true;
    } catch (err) {
      const text = err instanceof ApiError && err.message ? err.message : "Update failed.";
      setMessage({ kind: "err", text });
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const changePhoto = useCallback(async (file: File): Promise<string | null> => {
    setBusy(true);
    setMessage(null);
    try {
      const { photoUrl } = await profileService.changePhoto(file);
      setMessage({ kind: "ok", text: "Photo updated." });
      return photoUrl;
    } catch (err) {
      const text = err instanceof ApiError && err.message ? err.message : "Photo update failed.";
      setMessage({ kind: "err", text });
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const clearMessage = useCallback(() => setMessage(null), []);

  return { update, changePhoto, busy, message, clearMessage };
}
