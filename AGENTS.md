<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Dating App

This repository is a Next.js dating web app. See `REQUIREMENTS.md` for the authoritative scope.

## Stack snapshot

- Next.js 16, App Router, TypeScript, `src/app/` layout
- Tailwind CSS 4 (`@tailwindcss/postcss`)
- React 19
- Prisma + Neon Postgres (pooled `DATABASE_URL` for runtime, `DIRECT_URL` for migrations)
- Pusher Channels for realtime messaging (presence channels per match)
- Vercel Blob for profile photo storage
- Vitest + Testing Library + MSW for unit/integration tests
- ESLint via `eslint-config-next`
- npm as the package manager

## Commands

- `npm run dev` — start the Next.js dev server (`next dev`). Realtime is handled by Pusher Channels, so no custom Node server is needed.
- `npm run build` — production build
- `npm run start` — production server (`next start`)
- `npm run lint` — run ESLint
- `npm run test` — vitest in watch mode
- `npm run test:run` — vitest single-run (used by CI and the `main`-branch pipeline)
- `npm run test:coverage` — vitest with v8 coverage
- `npm run test:ui` — vitest UI
- `npm run db:migrate` — `prisma migrate dev`
- `npm run db:seed` — populate test users / matches / messages
- `npm run db:reset` — wipe + re-migrate (destructive)
- `npm run vapid:generate` — print a fresh VAPID keypair for push

## Conventions

- **Theme:** dark by default, with a light/dark toggle. Design primarily for dark, but every component must also render correctly in light mode. Persist the user's selection.
- **Styling:** use Tailwind utility classes. Co-locate component-level styles; reach for `globals.css` only for true global concerns.
- **Routing:** App Router. Pages live under `src/app/<route>/page.tsx`; shared layout in `src/app/layout.tsx`.
- **TypeScript:** strict mode is on. Keep types explicit at module boundaries.
- **Imports:** use the `@/*` path alias for everything under `src/`.
- **Files:** prefer editing existing files over creating new ones. Do not introduce new top-level documents without a reason.

## Working agreement

- Do not generate feature code unless the task explicitly asks for it. Setup-only tasks should not produce landing-page UI, components, or routes beyond what already exists.
- When requirements change, update `REQUIREMENTS.md` first; let the code follow.
- Validate UI work in the browser via `npm run dev` before declaring it done. Type checks and lint don't prove a feature works.
- Keep changes minimal and reversible. No speculative abstractions, no backwards-compat shims for code that has no history yet.

## Quality gates

- **Husky pre-push hook** (`.husky/pre-push`) runs `npm run lint` before any `git push`. The hook is installed automatically by the `prepare` script on `npm install`.
- **GitLab CI** (`.gitlab-ci.yml`) runs lint on every branch and MR, runs `npm run test:run` on MRs and on `main`, and builds + deploys to Vercel on `main`. Required CI variables: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Feature scope

See `REQUIREMENTS.md` for the authoritative list. Currently in scope:

1. Landing page (hero, about, footer)
2. User registration (email, age, bio, picture upload)
3. Profile management (view + edit name, bio, photo)
4. Discovery & matching (swipe, like/skip, filters by age and distance, mutual match)
5. Realtime text messaging via Socket.IO between matched users
6. Match list with unmatch
7. Bonus: browser push notifications
8. Bonus: light/dark theme toggle (default dark, persisted)

Explicitly out of scope: OAuth/social login, media messaging, group chat, payments, admin tooling, native mobile.
