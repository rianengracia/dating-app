import { RegisterForm } from "./RegisterForm";

export const metadata = {
  title: "TrueMatch — Create profile",
};

export default function RegisterPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="tm-rule" />
          <span className="tm-mono text-[11px] text-accent">AGENT // ENROLLMENT</span>
        </div>
        <h1 className="tm-display text-4xl md:text-5xl text-fg">Create your profile</h1>
        <p className="text-fg-muted max-w-lg">
          Fill out your dossier. Profiles must be photo-backed; no anonymous entries.
        </p>
      </header>

      <RegisterForm />
    </div>
  );
}
