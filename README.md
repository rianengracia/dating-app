# TrueMatch

A competitive, tactical-themed dating web app — "find your duo." Visual language inspired by Valorant (angular UI, deep navy + signature red, condensed display type).

See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the authoritative scope, [`AGENTS.md`](./AGENTS.md) for working agreements, and [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) for tokens and component specs.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, `src/app/`)
- **Frontend:** React 19 + Tailwind CSS 4
- **Database:** Neon Postgres + Prisma
- **Auth:** Email + password, bcrypt, JWT session in an httpOnly cookie
- **Realtime:** Pusher Channels (presence channel per match)
- **Image storage:** Vercel Blob
- **Tests:** Vitest + Testing Library + MSW
- **CI/CD:** GitLab CI and GitHub Actions (both target Vercel)
- **Package manager:** npm

## Getting started

### 1. Install

```bash
npm install
```

This also runs `prisma generate` (postinstall) and installs the Husky pre-push hook (prepare).

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required:

- `DATABASE_URL` — Neon pooled connection string (runtime queries)
- `DIRECT_URL` — Neon direct connection string (migrations)
- `JWT_SECRET` — 32+ character random string
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` — from the Pusher dashboard
- `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` — client copies
- `BLOB_READ_WRITE_TOKEN` — from the Vercel project's Storage tab

Optional (push notifications):

- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — generate locally with `npm run vapid:generate`

### 3. Set up the database

```bash
npm run db:migrate   # apply Prisma migrations
npm run db:seed      # populate test users / matches / messages
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server (`next start`) |
| `npm run lint` | Run ESLint |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run (used by CI) |
| `npm run test:coverage` | Vitest with v8 coverage |
| `npm run test:ui` | Vitest UI |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed test data |
| `npm run db:reset` | Wipe + re-migrate (destructive) |
| `npm run vapid:generate` | Print a fresh VAPID keypair |

## Quality gates

- **Husky pre-push** (`.husky/pre-push`) runs `npm run lint` before every push. Pushes fail if lint fails. The hook is installed automatically via the `prepare` script.
- **GitLab CI** (`.gitlab-ci.yml`) runs lint on every branch and merge request, runs `npm run test:run` on MRs and on `main`, then builds and deploys to Vercel from `main`.
- **GitHub Actions** (`.github/workflows/ci.yml`) mirrors the GitLab pipeline for the in-progress migration to GitHub: lint on every push, test on PRs and on `main`, build + Vercel deploy on `main`.

### Required CI secrets

The same three Vercel credentials are needed in both providers. Mark them protected/masked where supported.

| Variable | Where to find it |
| --- | --- |
| `VERCEL_TOKEN` | <https://vercel.com/account/tokens> |
| `VERCEL_ORG_ID` | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` |

- **GitLab:** Settings → CI/CD → Variables (Protected + Masked).
- **GitHub:** Settings → Secrets and variables → Actions → Repository secrets.

## Project layout

```
src/
  app/            Next.js App Router routes (pages, layouts, API route handlers)
  components/     Shared UI
  hooks/          Client hooks
  lib/            Server utilities (Prisma client, Pusher, uploads, auth)
  services/       Cross-cutting services (e.g. realtime)
prisma/
  schema.prisma   Database schema
  seed.ts         Seed script
tests/
  unit/           Vitest unit tests
  integration/    Vitest integration tests
  mocks/          MSW handlers
public/           Static assets and the push service worker (sw.js)
```

## Out of scope

OAuth/social login, media messaging, group chat, payments, admin tooling, native mobile apps. See `REQUIREMENTS.md` §7.
