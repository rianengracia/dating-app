# TrueMatch — Requirements

A competitive, tactical-themed dating web app. Visual language is inspired by **Valorant** (sharp angular UI, deep navy + signature red palette, condensed display type). The product is **TrueMatch** — find your duo.

---

## 1. Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript, `src/app/`) |
| Frontend | React 19 + Tailwind CSS 4 |
| Backend | Next.js Route Handlers (`app/api/**/route.ts`) — same project, server runtime |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Email + password, bcrypt password hashing, JWT session in an httpOnly cookie |
| Validation | Zod (shared between server and client) |
| Realtime | Socket.IO (custom Node server alongside Next, used only for messaging) |
| Image storage | Local `public/uploads/` for now; pluggable for S3/Cloudinary later |
| Lint | ESLint (`eslint-config-next`) |
| Package manager | npm |

### Environment variables

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/truematch
JWT_SECRET=<32+ char random string>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. UI Direction

- **Default theme:** dark (Valorant tactical look).
- **Theme toggle:** light/dark switch persisted to `localStorage`. Components must work in both palettes; dark is the primary design target.
- **Typography:** condensed display family for headings (Tungsten/Anton-style), neutral sans for body, monospace for tactical readouts (counts, codes, timers).
- **Geometry:** angular cuts (`clip-path` polygons), thin tactical lines, occasional skew on hover. No rounded pill buttons.
- See `DESIGN-SYSTEM.md` for tokens and component specs.

---

## 3. Data Model (initial)

```
User
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  displayName     String
  age             Int
  bio             String   // <= 280 chars
  photoUrl        String   // path or external URL
  latitude        Float?
  longitude       Float?
  pushSubscription Json?   // Web Push subscription, optional
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

Swipe
  id        String   @id @default(cuid())
  swiperId  String
  targetId  String
  action    SwipeAction  // LIKE | SKIP
  createdAt DateTime @default(now())
  @@unique([swiperId, targetId])

Match
  id        String   @id @default(cuid())
  userAId   String       // canonical: lower id
  userBId   String       // canonical: higher id
  createdAt DateTime @default(now())
  @@unique([userAId, userBId])

Message
  id        String   @id @default(cuid())
  matchId   String
  senderId  String
  body      String
  createdAt DateTime @default(now())
```

Constraints:
- A user can swipe a given target at most once.
- A `Match` is created server-side the moment two users hold mutual `LIKE` swipes.
- An `Unmatch` deletes the `Match` row and all `Message` rows belonging to it.
- Skipped users must not appear in the swiper's discovery feed again.

---

## 4. Core Features

### 4.1 Landing Page (`/`)

Public marketing entry point.

- **Hero banner**: TrueMatch wordmark, tagline ("FIND YOUR DUO"), short pitch, primary CTA → `/register`, secondary link → `/login`.
- **About the app**: 3 short value props (e.g. "Tactical matching", "Verified profiles", "Realtime comms") and a one-paragraph explainer.
- **Footer**: brand mark, tertiary nav links (About, Privacy, Terms — placeholders), social slot, copyright.

Acceptance:
- Renders without auth.
- Works on mobile (≥ 360 px) and desktop (≥ 1024 px).
- CTAs route to `/register` and `/login`.
- Theme toggle visible from the header.

### 4.2 User Registration (`/register`)

Form fields:
- **Email** — required, RFC 5322 format, must be unique.
- **Password** — required, ≥ 8 chars, must include letter + digit.
- **Display name** — required, 2–32 chars.
- **Age** — required integer ≥ 18 (legal floor).
- **Bio** — required, 1–280 chars, plain text.
- **Profile picture** — required, JPEG/PNG/WebP, ≤ 5 MB, stored under `public/uploads/`.

Endpoint: `POST /api/auth/register` (multipart/form-data)
- Validates input via zod.
- Hashes password with bcrypt (cost 12).
- Persists `User`.
- Issues JWT session cookie (`Set-Cookie: tm_session=...; HttpOnly; Secure; SameSite=Lax`).
- Returns redirect target `/discover`.

Errors surfaced to the user: duplicate email, validation failures (per-field), upload too large, file type unsupported.

### 4.3 Login (`/login`)

Form fields:
- **Email**
- **Password**

Endpoint: `POST /api/auth/login`
- Looks up user by email, compares hash with bcrypt.
- On success: issues session cookie, returns redirect `/discover`.
- On failure: generic `Invalid credentials` (do not leak which field was wrong).

Sign-out: `POST /api/auth/logout` clears the cookie.

### 4.4 Profile Management (`/profile`)

- **View**: avatar, display name, age, bio.
- **Edit**: name, bio, photo. Email and age are read-only in this iteration.
- Endpoint: `PATCH /api/profile` for fields, `POST /api/profile/photo` for image replacement.

### 4.5 Discovery & Matching (`/discover`)

- One profile at a time: photo, display name, age, bio.
- **Like**: `POST /api/swipe { targetId, action: "LIKE" }` — if the target has already liked the swiper, atomically create a `Match` and return `{ matched: true, matchId }`.
- **Skip**: `POST /api/swipe { targetId, action: "SKIP" }` — recorded; target is excluded from future feeds.
- **Filters**: query params on `GET /api/discover?minAge=&maxAge=&maxKm=`.
  - `minAge` / `maxAge`: integer 18–99.
  - `maxKm`: integer; computed via Haversine between current user and candidates with location set.
- Feed excludes: self, already-swiped users, and existing matches.
- UI affordances: keyboard arrows + on-screen buttons + drag/swipe gesture on touch.

### 4.6 Messaging (`/match/[matchId]`)

- Realtime via Socket.IO. Channel scoped to a `matchId`.
- Authentication: handshake validates the JWT cookie; only the two users in the match may join the room.
- Operations:
  - `message:send { matchId, body }` — server validates body (1–2000 chars), persists, then broadcasts `message:new` to the room.
  - History fetched on join via `GET /api/matches/:id/messages?cursor=`.
- Message ordering: server timestamp.
- No typing indicators / read receipts in this iteration (out of scope).

### 4.7 Match List (`/matches`)

- `GET /api/matches` — current user's matches with last message preview.
- Each row: avatar, display name, last message snippet, link to `/match/[matchId]`.
- **Unmatch**: `DELETE /api/matches/:id` removes match + messages for both users.

---

## 5. Bonus Features

### 5.1 Browser Push Notifications

- Use the Web Push API + Service Worker.
- Permission requested explicitly from the user (e.g., on first match).
- Server endpoint `POST /api/push/subscribe` stores the `PushSubscription` on `User.pushSubscription`.
- Triggers: new match formed, new message while the recipient's tab is not focused.
- The app must function fully without granted permission.

### 5.2 Theme Toggle

- Switch between dark and light.
- Default: **dark**.
- Persisted in `localStorage` under `tm_theme`. Applied via a `data-theme` attribute on `<html>` to avoid FOUC (set in a tiny inline script before hydration).
- Respects system preference only on first visit when no stored value exists.

---

## 6. Non-Functional Requirements

- **Accessibility**: WCAG AA contrast in both themes; all interactive elements keyboard-reachable; focus rings visible against the dark palette.
- **Responsive**: mobile-first; primary breakpoints at `sm` (640), `md` (768), `lg` (1024).
- **Security**: passwords hashed with bcrypt, sessions in httpOnly + SameSite=Lax cookies, CSRF protection on state-changing routes via SameSite + origin check, file upload type/size validation server-side.
- **Performance**: landing page LCP < 2.5 s on a 4G profile; route-level code splitting via App Router defaults.

---

## 7. Out of Scope

- OAuth / social login.
- Voice, video, or media messaging (text only).
- Group chat (1-to-1 only between matched users).
- Payments, subscriptions, premium tiers.
- Admin / moderation tooling.
- Native mobile apps.

---

## 8. Milestones

1. **M0 — Setup** *(done)*: scaffold, REQUIREMENTS, AGENTS.
2. **M1 — Surface** *(this milestone)*: design system tokens, landing page, registration page + API, login page + API, Prisma schema.
3. **M2 — Profile + Discovery**: profile view/edit, discover feed, swipe + match formation, filters.
4. **M3 — Realtime**: Socket.IO server, match list, conversation view, unmatch.
5. **M4 — Polish**: web push, theme toggle UX, accessibility pass, deploy.
