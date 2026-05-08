import Link from "next/link";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="border-t border-line mt-auto">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 py-12 grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <Brand size="sm" />
          <p className="text-sm text-fg-muted max-w-xs">
            Tactical matchmaking for people who play to win — at love, at least.
          </p>
        </div>

        <nav className="space-y-3">
          <h3 className="tm-mono text-xs text-fg-dim">PRODUCT</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/register" className="text-fg-muted hover:text-fg">
                Create profile
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-fg-muted hover:text-fg">
                Sign in
              </Link>
            </li>
            <li>
              <span className="text-fg-dim">Discover (coming soon)</span>
            </li>
          </ul>
        </nav>

        <nav className="space-y-3">
          <h3 className="tm-mono text-xs text-fg-dim">LEGAL</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-fg-muted">Privacy</span>
            </li>
            <li>
              <span className="text-fg-muted">Terms</span>
            </li>
            <li>
              <span className="text-fg-muted">Cookies</span>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12 py-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
          <p className="tm-mono text-[10px] text-fg-dim">
            © {new Date().getFullYear()} TRUEMATCH // ALL RIGHTS RESERVED
          </p>
          <p className="tm-mono text-[10px] text-fg-dim">
            BUILD <span className="text-accent">v0.1.0</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
