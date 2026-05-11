import { getCurrentUser } from "@/lib/auth-server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const user = await getCurrentUser();
  const authed = !!user;
  return (
    <>
      <Header authed={authed} />
      <main className="flex-1">
        <Hero authed={authed} />
        <About />
        <Stats />
      </main>
      <Footer />
    </>
  );
}

function Hero({ authed }: { authed: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="absolute inset-0 tm-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -right-32 -top-32 w-[480px] h-[480px] bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 bottom-0 w-[360px] h-[360px] bg-cyan/5 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-[1200px] px-6 md:px-12 py-24 md:py-32 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-8">
          <div className="flex items-center gap-3">
            <span className="tm-rule" />
            <span className="tm-mono text-[11px] text-accent">SEASON 01 // OPEN BETA</span>
          </div>

          <h1 className="tm-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-fg">
            FIND YOUR
            <br />
            <span className="text-accent">DUO.</span>
          </h1>

          <p className="text-lg text-fg-muted max-w-xl">
            TrueMatch is a tactical dating app for people who play to win. Build a profile,
            scan the lobby, lock in mutual matches, and queue up a conversation in realtime.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {authed ? (
              <Button href="/discover" variant="primary" size="lg">
                ENTER LOBBY
              </Button>
            ) : (
              <>
                <Button href="/register" variant="primary" size="lg">
                  ENGAGE — CREATE PROFILE
                </Button>
                <Button href="/login" variant="secondary" size="lg">
                  SIGN IN
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <span className="tm-mono text-[10px] text-fg-dim">STATUS</span>
            <span className="inline-flex items-center gap-2 tm-mono text-[10px] text-success">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              SERVERS ONLINE
            </span>
          </div>
        </div>

        <div className="md:col-span-5">
          <HeroPanel />
        </div>
      </div>
    </section>
  );
}

function HeroPanel() {
  return (
    <div className="relative">
      <div className="absolute -top-1 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />
      <div className="bg-surface border border-line tm-clip-br p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="tm-mono text-[10px] text-fg-dim">AGENT // DOSSIER</span>
          <span className="tm-mono text-[10px] text-cyan">LIVE</span>
        </div>

        <div className="space-y-3">
          <ProfileLine label="HANDLE" value="JETT_27" />
          <ProfileLine label="REGION" value="MNL // 04 KM" />
          <ProfileLine label="ROLE" value="DUELIST" />
          <ProfileLine label="STATUS" value="QUEUED" accent />
        </div>

        <div className="border-t border-line pt-4 space-y-3">
          <p className="text-sm text-fg-muted leading-relaxed">
            "Looking for a partner who pushes site without checking the minimap.
            Coffee after the round."
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="border border-line p-3 tm-clip-tl">
            <div className="tm-mono text-[10px] text-fg-dim">MATCHES</div>
            <div className="tm-display text-2xl text-fg">128</div>
          </div>
          <div className="border border-line p-3 tm-clip-tl">
            <div className="tm-mono text-[10px] text-fg-dim">REPLIES</div>
            <div className="tm-display text-2xl text-cyan">94%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileLine({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-line/60 pb-2 last:border-b-0 last:pb-0">
      <span className="tm-mono text-[10px] text-fg-dim">{label}</span>
      <span className={`tm-mono text-xs ${accent ? "text-accent" : "text-fg"}`}>{value}</span>
    </div>
  );
}

function About() {
  const items = [
    {
      tag: "01",
      title: "Tactical matching",
      copy: "Filter by age and distance. Skip the noise. Like once and the system locks in mutual interest the instant it's reciprocated.",
    },
    {
      tag: "02",
      title: "Realtime comms",
      copy: "Once you match, jump straight into a conversation. Messages stream over a websocket — no polling, no lag.",
    },
    {
      tag: "03",
      title: "Verified profiles",
      copy: "Every account is photo-backed. No empty profiles, no copy-pasted bios. Show up as you are or don't show up.",
    },
  ];

  return (
    <section id="about" className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 py-20 md:py-28">
        <div className="flex items-center gap-3 mb-6">
          <span className="tm-rule" />
          <span className="tm-mono text-[11px] text-accent">ABOUT // TRUEMATCH</span>
        </div>

        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <h2 className="tm-display text-4xl md:text-5xl md:col-span-6 text-fg">
            Built for the players,
            <br />
            <span className="text-fg-muted">not the lurkers.</span>
          </h2>
          <p className="md:col-span-6 text-base text-fg-muted leading-relaxed">
            Most dating apps reward indecision. TrueMatch rewards intent. Your profile is
            either ready to queue or it isn't. Your filters are explicit. Your matches are
            mutual or they don't exist. Everything else is noise.
          </p>
        </div>

        <ul className="grid md:grid-cols-3 gap-6">
          {items.map((item) => (
            <li
              key={item.tag}
              className="bg-surface border border-line tm-clip-br p-6 space-y-4 relative"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-transparent" />
              <div className="tm-mono text-[10px] text-accent">{item.tag}</div>
              <h3 className="tm-display text-2xl text-fg">{item.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{item.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: "ACTIVE AGENTS", v: "12,400" },
            { k: "MATCHES / DAY", v: "3,820" },
            { k: "AVG REPLY TIME", v: "00:04:12" },
            { k: "REGIONS", v: "07" },
          ].map((s) => (
            <div key={s.k} className="space-y-1">
              <div className="tm-mono text-[10px] text-fg-dim">{s.k}</div>
              <div className="tm-display text-3xl md:text-4xl text-fg">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
