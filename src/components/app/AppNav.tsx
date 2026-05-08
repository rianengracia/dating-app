"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "@/components/layout/Brand";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type Props = {
  user: { displayName: string; photoUrl: string };
};

const links = [
  { href: "/discover", label: "DISCOVER" },
  { href: "/matches", label: "MATCHES" },
  { href: "/profile", label: "PROFILE" },
];

export function AppNav({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-bg/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 h-16 flex items-center justify-between gap-6">
        <Brand size="sm" href="/discover" />

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`tm-mono text-[11px] px-3 py-2 transition-colors ${
                  active
                    ? "text-accent border-b-2 border-accent"
                    : "text-fg-muted hover:text-fg border-b-2 border-transparent"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.photoUrl}
              alt=""
              className="w-7 h-7 object-cover tm-clip-tl border border-line"
            />
            <span className="tm-mono text-[10px] text-fg-muted">{user.displayName.toUpperCase()}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="tm-mono text-[10px] text-fg-muted hover:text-accent transition-colors"
          >
            SIGN OUT
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
