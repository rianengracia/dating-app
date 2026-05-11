import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const metadata = {
  title: "TrueMatch — 404 // No signal",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 tm-grid-bg opacity-20 pointer-events-none" />
        <div className="absolute -right-40 -top-40 w-[480px] h-[480px] bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-[760px] px-6 md:px-12 py-24 md:py-32 space-y-10">
          <div className="flex items-center gap-3">
            <span className="tm-rule" />
            <span className="tm-mono text-[11px] text-accent">SIGNAL // LOST</span>
          </div>

          <div className="space-y-6">
            <h1 className="tm-display text-6xl md:text-8xl text-fg leading-none">
              404
              <br />
              <span className="text-accent">NO MATCH.</span>
            </h1>
            <p className="text-lg text-fg-muted max-w-lg">
              The route you queued doesn&apos;t exist on the map. Either the link is
              stale, or the page was never deployed. Jump back to safer ground.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button href="/" variant="primary" size="lg">
              ▸ RETURN TO LOBBY
            </Button>
            <Button href="/register" variant="secondary" size="lg">
              CREATE PROFILE
            </Button>
          </div>

          <div className="border-t border-line pt-6">
            <p className="tm-mono text-[10px] text-fg-dim mb-3">QUICK NAV</p>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="tm-mono text-xs text-fg-muted hover:text-accent transition-colors"
                >
                  / HOME
                </Link>
              </li>
              <li>
                <a
                  href="/register"
                  className="tm-mono text-xs text-fg-muted hover:text-accent transition-colors"
                >
                  / REGISTER
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="tm-mono text-xs text-fg-muted hover:text-accent transition-colors"
                >
                  / LOGIN
                </a>
              </li>
              <li>
                <a
                  href="/discover"
                  className="tm-mono text-xs text-fg-muted hover:text-accent transition-colors"
                >
                  / DISCOVER
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
