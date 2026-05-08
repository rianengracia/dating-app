import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "TrueMatch — Sign in",
};

export default function LoginPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="tm-rule" />
          <span className="tm-mono text-[11px] text-accent">AGENT // SIGN IN</span>
        </div>
        <h1 className="tm-display text-4xl md:text-5xl text-fg">Welcome back</h1>
        <p className="text-fg-muted">Authenticate to re-enter the lobby.</p>
      </header>

      <LoginForm />
    </div>
  );
}
