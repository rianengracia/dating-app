import { requireUserPage } from "@/lib/auth-server";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "TrueMatch — Profile" };

export default async function ProfilePage() {
  const user = await requireUserPage();
  return (
    <div className="mx-auto max-w-[1000px] px-6 md:px-12 py-12 md:py-16">
      <header className="space-y-4 mb-10">
        <div className="flex items-center gap-3">
          <span className="tm-rule" />
          <span className="tm-mono text-[11px] text-accent">DOSSIER // {user.displayName.toUpperCase()}</span>
        </div>
        <h1 className="tm-display text-4xl md:text-5xl">Your profile</h1>
        <p className="text-fg-muted">
          Edit your display name, bio, and photo. Email and age are locked once your profile
          is created.
        </p>
      </header>

      <ProfileClient
        initial={{
          email: user.email,
          age: user.age,
          displayName: user.displayName,
          bio: user.bio,
          photoUrl: user.photoUrl,
        }}
      />
    </div>
  );
}
