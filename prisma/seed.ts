/**
 * TrueMatch seed data.
 *
 * Creates 8 test users with deterministic avatars, plus a web of swipes that
 * yield several mutual matches and a few sample conversations.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient, SwipeAction } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const SEED_PASSWORD = "password123";

type AgentSeed = {
  email: string;
  displayName: string;
  age: number;
  bio: string;
  lat: number;
  lon: number;
  bgFar: string;
  bgNear: string;
  accent: string;
};

// Manila-area coordinates so distance filtering produces realistic numbers.
const AGENTS: AgentSeed[] = [
  {
    email: "jett@truematch.gg",
    displayName: "Jett",
    age: 27,
    bio: "Looking for a partner who pushes site without checking the minimap. Coffee after the round.",
    lat: 14.5547,
    lon: 121.0244,
    bgFar: "#0F1923",
    bgNear: "#1F4A5C",
    accent: "#5CE1E6",
  },
  {
    email: "phoenix@truematch.gg",
    displayName: "Phoenix",
    age: 29,
    bio: "Will literally walk into a fire for someone. Looking for a co-pilot, not a passenger.",
    lat: 14.5995,
    lon: 120.9842,
    bgFar: "#1A1410",
    bgNear: "#5C2A1F",
    accent: "#FF7A33",
  },
  {
    email: "sage@truematch.gg",
    displayName: "Sage",
    age: 32,
    bio: "Healer in every sense. Looking for someone who actually answers when you ask how they're doing.",
    lat: 14.6760,
    lon: 121.0437,
    bgFar: "#0F1A18",
    bgNear: "#1F5C45",
    accent: "#A1E887",
  },
  {
    email: "viper@truematch.gg",
    displayName: "Viper",
    age: 34,
    bio: "Chemical engineer by day. Strong opinions about espresso. Don't ghost me — I'll find your address.",
    lat: 14.5378,
    lon: 121.0014,
    bgFar: "#0F1814",
    bgNear: "#1F5C2E",
    accent: "#7CFF6B",
  },
  {
    email: "omen@truematch.gg",
    displayName: "Omen",
    age: 30,
    bio: "Quiet, but present. I read books. I take walks. I do not text first but I will text often once we click.",
    lat: 14.6091,
    lon: 121.0223,
    bgFar: "#13121A",
    bgNear: "#3A2A5C",
    accent: "#9D7BFF",
  },
  {
    email: "brimstone@truematch.gg",
    displayName: "Brim",
    age: 38,
    bio: "Old enough to know what I want. Veteran. Cooks a serious adobo. Looking for someone who values plans.",
    lat: 14.5176,
    lon: 121.0509,
    bgFar: "#1A1410",
    bgNear: "#5C3A1F",
    accent: "#F2A33B",
  },
  {
    email: "killjoy@truematch.gg",
    displayName: "Killjoy",
    age: 26,
    bio: "Engineer. Cat owner. I can fix your wifi but not your group chat. Direct messages only.",
    lat: 14.5871,
    lon: 121.0623,
    bgFar: "#1A1812",
    bgNear: "#5C5230",
    accent: "#F2C94C",
  },
  {
    email: "skye@truematch.gg",
    displayName: "Skye",
    age: 28,
    bio: "Outdoorsy without the LinkedIn-bio cliché. Trails, breweries, dogs. Bring snacks.",
    lat: 14.6332,
    lon: 121.0784,
    bgFar: "#101814",
    bgNear: "#2C5C3F",
    accent: "#A1E887",
  },
];

function avatarSvg(agent: AgentSeed): string {
  const initials = agent.displayName.slice(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${agent.bgFar}"/>
      <stop offset="100%" stop-color="${agent.bgNear}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <rect width="600" height="800" fill="url(#grid)"/>

  <!-- thin red diagonal bar -->
  <g transform="rotate(-20 300 400)">
    <rect x="-200" y="180" width="1000" height="6" fill="#FF4655" opacity="0.85"/>
    <rect x="-200" y="200" width="1000" height="2" fill="#FF4655" opacity="0.4"/>
  </g>

  <!-- accent geometry -->
  <polygon points="80,100 200,100 220,140 60,140" fill="${agent.accent}" opacity="0.85"/>
  <polygon points="420,640 560,640 560,680 440,680" fill="${agent.accent}" opacity="0.6"/>
  <circle cx="500" cy="180" r="60" fill="none" stroke="${agent.accent}" stroke-width="2" opacity="0.6"/>
  <circle cx="500" cy="180" r="100" fill="none" stroke="${agent.accent}" stroke-width="1" opacity="0.35"/>

  <!-- silhouette band -->
  <rect x="0" y="520" width="600" height="280" fill="#0F1923" opacity="0.55"/>

  <!-- callouts -->
  <text x="40" y="60" font-family="Consolas, monospace" font-size="14" letter-spacing="3" fill="#ECE8E1" opacity="0.7">TRUE//MATCH</text>
  <text x="560" y="60" text-anchor="end" font-family="Consolas, monospace" font-size="14" letter-spacing="3" fill="#FF4655">// AGENT</text>

  <!-- big initials -->
  <text x="40" y="700" font-family="Impact, 'Arial Black', sans-serif" font-size="220" font-weight="900" letter-spacing="6" fill="#ECE8E1">${initials}</text>

  <!-- footer line -->
  <text x="40" y="750" font-family="Consolas, monospace" font-size="14" letter-spacing="3" fill="#FF4655">▸ ${agent.displayName.toUpperCase()} // AGE ${agent.age}</text>
  <line x1="40" y1="765" x2="200" y2="765" stroke="#FF4655" stroke-width="2"/>
</svg>`;
}

async function writeAvatars(): Promise<Map<string, string>> {
  const dir = path.join(process.cwd(), "public", "seed");
  await mkdir(dir, { recursive: true });
  const map = new Map<string, string>();
  for (const agent of AGENTS) {
    const fileName = `agent-${agent.displayName.toLowerCase()}.svg`;
    const fullPath = path.join(dir, fileName);
    await writeFile(fullPath, avatarSvg(agent), "utf8");
    map.set(agent.email, `/seed/${fileName}`);
  }
  return map;
}

async function main() {
  console.log("▸ TrueMatch seed: writing avatars...");
  const photos = await writeAvatars();

  console.log("▸ TrueMatch seed: hashing password...");
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  console.log("▸ TrueMatch seed: clearing existing seed data...");
  // Delete in dependency order. We restrict deletion to seed emails to avoid
  // wiping a developer's manually created accounts.
  const seedEmails = AGENTS.map((a) => a.email);
  await prisma.message.deleteMany({
    where: {
      OR: [
        { sender: { email: { in: seedEmails } } },
        { match: { OR: [{ userA: { email: { in: seedEmails } } }, { userB: { email: { in: seedEmails } } }] } },
      ],
    },
  });
  await prisma.match.deleteMany({
    where: {
      OR: [
        { userA: { email: { in: seedEmails } } },
        { userB: { email: { in: seedEmails } } },
      ],
    },
  });
  await prisma.swipe.deleteMany({
    where: {
      OR: [
        { swiper: { email: { in: seedEmails } } },
        { target: { email: { in: seedEmails } } },
      ],
    },
  });
  await prisma.user.deleteMany({ where: { email: { in: seedEmails } } });

  console.log("▸ TrueMatch seed: creating users...");
  const created = new Map<string, { id: string; displayName: string }>();
  for (const a of AGENTS) {
    const photoUrl = photos.get(a.email)!;
    const u = await prisma.user.create({
      data: {
        email: a.email,
        passwordHash,
        displayName: a.displayName,
        age: a.age,
        bio: a.bio,
        photoUrl,
        latitude: a.lat,
        longitude: a.lon,
      },
      select: { id: true, displayName: true, email: true },
    });
    created.set(a.email, { id: u.id, displayName: u.displayName });
  }
  const id = (email: string): string => created.get(email)!.id;

  console.log("▸ TrueMatch seed: writing swipes & matches...");
  // Mutual likes (will form matches): pairs.
  const mutualPairs: [string, string][] = [
    ["jett@truematch.gg", "phoenix@truematch.gg"],
    ["jett@truematch.gg", "sage@truematch.gg"],
    ["viper@truematch.gg", "omen@truematch.gg"],
    ["brimstone@truematch.gg", "killjoy@truematch.gg"],
    ["skye@truematch.gg", "phoenix@truematch.gg"],
  ];
  // One-sided likes (no match yet).
  const oneSidedLikes: [string, string][] = [
    ["jett@truematch.gg", "viper@truematch.gg"],
    ["omen@truematch.gg", "skye@truematch.gg"],
    ["killjoy@truematch.gg", "jett@truematch.gg"],
  ];
  // Skips (target excluded from feed).
  const skips: [string, string][] = [
    ["jett@truematch.gg", "brimstone@truematch.gg"],
    ["sage@truematch.gg", "viper@truematch.gg"],
  ];

  const swipes: { swiperId: string; targetId: string; action: SwipeAction }[] = [];
  for (const [a, b] of mutualPairs) {
    swipes.push({ swiperId: id(a), targetId: id(b), action: "LIKE" });
    swipes.push({ swiperId: id(b), targetId: id(a), action: "LIKE" });
  }
  for (const [a, b] of oneSidedLikes) {
    swipes.push({ swiperId: id(a), targetId: id(b), action: "LIKE" });
  }
  for (const [a, b] of skips) {
    swipes.push({ swiperId: id(a), targetId: id(b), action: "SKIP" });
  }
  await prisma.swipe.createMany({ data: swipes, skipDuplicates: true });

  // Form matches from mutual likes (canonical pair: lower id first).
  for (const [a, b] of mutualPairs) {
    const ida = id(a);
    const idb = id(b);
    const pair = ida < idb ? { userAId: ida, userBId: idb } : { userAId: idb, userBId: ida };
    await prisma.match.upsert({
      where: { userAId_userBId: pair },
      update: {},
      create: pair,
    });
  }

  console.log("▸ TrueMatch seed: writing sample messages...");
  // Add a small conversation to the Jett ↔ Phoenix match.
  const jettId = id("jett@truematch.gg");
  const phoenixId = id("phoenix@truematch.gg");
  const jpPair =
    jettId < phoenixId
      ? { userAId: jettId, userBId: phoenixId }
      : { userAId: phoenixId, userBId: jettId };
  const jpMatch = await prisma.match.findUnique({ where: { userAId_userBId: jpPair } });
  if (jpMatch) {
    const now = Date.now();
    const msgs = [
      { senderId: phoenixId, body: "Yo. Saw you queued up in Manila. Good rounds tonight?" },
      { senderId: jettId, body: "Two hours sleep. Considering a third coffee. You?" },
      { senderId: phoenixId, body: "About to lose against my landlord at darts. Win me dinner instead?" },
      { senderId: jettId, body: "Friday. Pick the spot." },
    ];
    for (let i = 0; i < msgs.length; i++) {
      await prisma.message.create({
        data: {
          matchId: jpMatch.id,
          senderId: msgs[i].senderId,
          body: msgs[i].body,
          createdAt: new Date(now - (msgs.length - i) * 60_000),
        },
      });
    }
  }

  console.log("");
  console.log("✓ TrueMatch seed complete.");
  console.log("");
  console.log("  All seed accounts share password: " + SEED_PASSWORD);
  console.log("  Sign in with any of:");
  for (const a of AGENTS) console.log("    - " + a.email);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
