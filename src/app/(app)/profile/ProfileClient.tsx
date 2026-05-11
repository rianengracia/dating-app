"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ensurePushSubscription, getPushPermissionState } from "@/lib/push-client";
import { useProfile } from "@/hooks/useProfile";

type Initial = {
  email: string;
  age: number;
  displayName: string;
  bio: string;
  photoUrl: string;
};

export function ProfileClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { update, changePhoto, busy, message, clearMessage } = useProfile();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushState, setPushState] = useState<
    "unknown" | "default" | "granted" | "denied" | "unsupported"
  >(() => getPushPermissionState());

  async function saveDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = await update({ displayName, bio });
    if (ok) router.refresh();
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const url = await changePhoto(file);
    if (url) {
      setPhotoUrl(url);
      router.refresh();
    }
  }

  async function enablePush() {
    setPushBusy(true);
    setPushMessage(null);
    clearMessage();
    try {
      const result = await ensurePushSubscription();
      setPushState(getPushPermissionState());
      setPushMessage(result.ok ? "Push notifications enabled." : result.error);
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-8">
      <aside className="space-y-4">
        <div className="bg-surface border border-line tm-clip-br p-4 relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-accent to-transparent" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={displayName}
            className="w-full aspect-3/4 object-cover tm-clip-br"
          />
          <div className="mt-3 space-y-1">
            <div className="tm-mono text-[10px] text-fg-dim">HANDLE</div>
            <div className="tm-display text-2xl text-fg">{displayName.toUpperCase()}</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] tm-mono">
            <div className="border border-line p-2 tm-clip-tl">
              <div className="text-fg-dim">AGE</div>
              <div className="text-fg">{initial.age}</div>
            </div>
            <div className="border border-line p-2 tm-clip-tl">
              <div className="text-fg-dim">EMAIL</div>
              <div className="text-fg truncate text-[10px]">{initial.email}</div>
            </div>
          </div>
        </div>

        <label
          htmlFor="photo"
          className="tm-mono text-[11px] text-fg border border-line hover:border-accent px-4 h-11 flex items-center justify-center tm-clip-tl cursor-pointer transition-colors"
        >
          ▸ REPLACE PHOTO
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onPickPhoto}
          disabled={busy}
        />

        <div className="bg-surface border border-line tm-clip-br p-4 space-y-3">
          <div className="tm-mono text-[10px] text-fg-dim">PUSH NOTIFICATIONS</div>
          <PushStatusRow state={pushState} />
          {pushMessage && <div className="tm-mono text-[11px] text-fg-muted">▸ {pushMessage}</div>}
          {pushState !== "granted" && pushState !== "unsupported" && (
            <Button type="button" variant="secondary" size="sm" onClick={enablePush} disabled={pushBusy}>
              {pushBusy ? "ENABLING..." : "ENABLE PUSH"}
            </Button>
          )}
        </div>
      </aside>

      <form
        onSubmit={saveDetails}
        className="bg-surface border border-line tm-clip-br p-6 md:p-8 space-y-6 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-accent to-transparent" />

        {message && (
          <div
            className={`border px-4 py-3 tm-mono text-xs tm-clip-tl ${
              message.kind === "ok"
                ? "border-success text-success bg-success/10"
                : "border-accent text-accent bg-accent/10"
            }`}
          >
            ▸ {message.text}
          </div>
        )}

        <Field label="DISPLAY NAME" htmlFor="displayName">
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
            minLength={2}
            maxLength={32}
            required
          />
        </Field>

        <Field label="BIO" htmlFor="bio" hint={`${bio.length} / 280`}>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.currentTarget.value)}
            maxLength={280}
            required
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" disabled={busy}>
            {busy ? "SAVING..." : "SAVE CHANGES"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PushStatusRow({ state }: { state: "unknown" | "default" | "granted" | "denied" | "unsupported" }) {
  const { tone, label } = (() => {
    switch (state) {
      case "granted":
        return { tone: "text-success", label: "ENABLED" };
      case "denied":
        return { tone: "text-accent", label: "BLOCKED IN BROWSER" };
      case "unsupported":
        return { tone: "text-fg-dim", label: "UNSUPPORTED" };
      default:
        return { tone: "text-fg-muted", label: "NOT ENABLED" };
    }
  })();
  return <div className={`tm-mono text-xs ${tone}`}>▸ {label}</div>;
}
