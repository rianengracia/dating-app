import Link from "next/link";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ authed = false }: { authed?: boolean } = {}) {
  return (
    <header className="border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 h-16 flex items-center justify-between">
        <Brand size="md" />
        <nav className="flex items-center gap-6">
          {authed ? (
            <Link
              href="/discover"
              className="tm-mono text-xs bg-accent hover:bg-accent-hover text-[#0F1923] px-4 py-2 tm-clip-tl transition-colors"
            >
              ENTER LOBBY
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="tm-mono text-xs text-fg-muted hover:text-fg transition-colors hidden sm:inline-block"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                className="tm-mono text-xs bg-accent hover:bg-accent-hover text-[#0F1923] px-4 py-2 tm-clip-tl transition-colors"
              >
                ENGAGE
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
