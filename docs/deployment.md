# Deploying Mojo (free-tier stack)

Mojo deploys with zero paid infrastructure. Every piece below has a free tier
that is enough for a real, usable product: two Next.js apps on Vercel Hobby, a
Supabase Postgres for Prisma, LiveKit Cloud for the lab, Resend for email, and
Paystack's test mode for payouts. GitHub Actions runs the checks and the
deploys — public repos on GitHub get free Actions minutes.

## The stack

| Need | Service | Free tier | Env vars |
|---|---|---|---|
| Hosting (hub) | Vercel Hobby | 1 project each | — |
| Hosting (admin) | Vercel Hobby | — | — |
| Database | Supabase (managed Postgres) | 500 MB, always-free | `DATABASE_URL` |
| Live video/chat/whiteboard | LiveKit Cloud | ~50k minutes/mo | `LIVEKIT_*` |
| Lab file storage | Supabase Storage | 1 GB | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Transactional email | Resend | 3k emails/mo | `RESEND_API_KEY` |
| Payouts | Paystack sandbox | test keys free | `PAYSTACK_SECRET_KEY` |
| Mobile builds | EAS (Expo) | limited free builds | — (see §7) |
| CI/CD | GitHub Actions | 2k min/mo (public repo) | repo secrets |

One app runs in **demo mode** by default (`USE_PRISMA=false`): the composition
roots (`apps/hub/demo`, `apps/admin/demo`) seed an in-memory `DemoState` with
demo accounts (see README). Flip `USE_PRISMA=true` to swap in the Prisma
repositories — the same interfaces, same use-cases, different persistence.

## 1. Database (Supabase free)

### Local dev (Docker)

The repo ships a `docker-compose.yml` with postgres:17 mapped to host port
**8642** (not 5432, so it runs alongside other local Postgres containers):

```bash
docker compose up -d postgres   # credentials mirror .env: mojo/mojo-dev, db mojo
npx prisma migrate deploy       # applies prisma/migrations to localhost:8642
npm run prisma:seed             # optional: first admin + subject catalogue
```

The volume `mojo-postgres-data` persists data across restarts; `docker compose
down` stops the container without deleting it. This database is strictly
local — production (`USE_PRISMA=true` on Vercel) must point at Supabase below,
never at `localhost`.

### Supabase (production)

1. Create a project at <https://supabase.com> (free plan).
2. Open **Project Settings → Database → Connection string**, copy the
   **URI** (transaction-pooler or direct). For migrations use the direct
   `postgresql://` string; set:

   ```bash
   # .env — local dev
   USE_PRISMA=true
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
   ```

   Vercel supports the `?pgbouncer=true` / pooler settings — see Supabase's
   "Connect from Vercel" guide for the exact string.
3. Build the schema and push it:

   ```bash
   npm run prisma:generate
   npx prisma migrate dev          # local: creates + applies migrations
   npx prisma migrate deploy       # CI / Vercel: applies committed migrations
   ```

4. Hold on to a **service-role** key (Project Settings → API) for
   `SUPABASE_SERVICE_ROLE_KEY` when you want lab file uploads to object
   storage instead of the in-browser fallback.

## 2. Lab (LiveKit Cloud)

1. Create an account at <https://livekit.io> and a new project — the free
   Starter tier includes roughly 50k monthly minutes.
2. Copy **API key**, **API secret**, and the `wss://<project>.livekit.cloud`
   URL into `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`.

   Without these three the lab pages render a friendly "LiveKit is not
   configured" card instead of erroring; the rest of the app works fine.

### Video quality ladder

The lab's Settings panel (`libs/lab`) offers a free ladder of **144p → 240p
→ 360p → 480p → 720p, capped at 1080p**. Each rung re-publishes the camera
with a matched capture resolution *and* publish bitrate (`setCameraEnabled`
with capture + publish options), and the room runs with `adaptiveStream`,
`dynacast`, and `simulcast` on so viewers automatically receive a fitting
layer. Anything above 1080p (1440p, 2160p) is defined in
`libs/lab/src/domain/lab-video-quality.ts` with `requiresPlus: true` and
renders disabled until the paid plan lands — unlocking it is a matter of
passing `hasPlus: true` from the pricing entitlement, no refactor needed.

## 3. Payouts & email (both optional in demo)

- **Paystack** — dashboard → Settings → API Keys. Test keys are free and do
  not require a live bank account. Set `PAYSTACK_SECRET_KEY`.
- **Resend** — create an API key, verify a sender domain (or use the shared
  `onboarding@resend.dev` for testing). Set `RESEND_API_KEY`.

Notifications fall back to an in-memory log (see the hub's notifications page)
when either channel is unconfigured.

## 4. Hosting (Vercel Hobby, free)

Create one Vercel project per app. For each, set:

| Setting | Hub | Admin |
|---|---|---|
| Root Directory | `apps/hub` | `apps/admin` |
| Framework preset | Next.js | Next.js |
| Build command | `npm run build` | `npm run build` |
| Install command | `npm install` | `npm install` |
| Output | `.next` (auto) | `.next` (auto) |

Add the app's env vars (from `.env.example`) in each project's
**Settings → Environment Variables**. `USE_PRISMA=true` must be set only once
the Supabase database is reachable from Vercel — until then leave it unset so
the app runs on the seeded demo data. These dashboard values are the production
source of truth (the CI `deploy` job pulls them via `vercel pull`): never copy
localhost URLs there — `DATABASE_URL` must be the Supabase pooler string and
`HUB_URL` the deployed `https://<hub>.vercel.app`, or Prisma and the
admin→hub bridge break in production. Keep one `RESEND_API_KEY` entry (no
empty duplicate) and use live Paystack keys once real payouts flow.

> Tip: point the `DATABASE_URL` hostname at Supabase's connection-pooler
> address so serverless functions don't exhaust Postgres connections.

## 5. Deploy from GitHub Actions

The repo ships `.github/workflows/ci.yml` with two jobs:

- **checks** (every push/PR): install → `prisma:generate` → boundary lint →
  `vitest run` → per-app `tsc --noEmit` → production builds. Nothing deploys
  until all checks are green.
- **deploy** (push to `main` only, after checks): builds each app with the
  Vercel CLI and ships it to Production.

To enable deployment:

1. Link each app once locally so Vercel knows the project:

   ```bash
   cd apps/hub && npx vercel link --yes --project <hub-project-name>
   cd apps/admin && npx vercel link --yes --project <admin-project-name>
   ```

   This writes `apps/*/.vercel/project.json` (commit it — it contains the
   project id, not secrets).
2. In `vercel` CLI: `npx vercel login`, then `npx vercel tokens create` — copy
   the token into a GitHub **repository secret** named `VERCEL_TOKEN`.
3. From <https://vercel.com/account/settings> copy your **Team/Org id** into a
   secret named `VERCEL_ORG_ID`.
4. Copy each project id (from `apps/*/.vercel/project.json`) into secrets
   `VERCEL_HUB_PROJECT_ID` and `VERCEL_ADMIN_PROJECT_ID`.
5. Push to `main`. The `deploy` job pulls the production env vars from Vercel
   (so secrets never live in the repo), builds `--prebuilt`, and ships both
   apps.

To skip Actions deploys entirely, Vercel's native Git integration is an
equally free option: connect the repo and Vercel deploys previews for every
PR and production on `main`, with checks surfaced in the PR.

## 6. Rollout checklist

```bash
npm install
npm run prisma:generate        # generate Prisma client
npx prisma migrate deploy      # apply schema to Supabase (prod path)
node prisma/seed-marketplace.mjs  # DEV ONLY: tutors/students/sessions/reviews
                               # for the landing page (prod starts empty;
                               # landing sections hide gracefully)
npm test                       # vitest run
npm run lint:boundaries
npx tsc --noEmit -p apps/hub/tsconfig.json
npx tsc --noEmit -p apps/admin/tsconfig.json
npm run build                  # lint:boundaries && hub+admin builds (mobile
                               # excluded — EAS stays explicit, see §7)
npx nx export mobile           # Metro bundle check (ios/android/web)
```

Production URLs land at `https://<hub>.vercel.app` and
`https://<admin>.vercel.app`; the hub serves the student/tutor marketplaces,
the admin app the ops console.

## 7. Mobile (EAS, free tier)

`apps/mobile` talks to the deployed hub over HTTPS — no mobile-specific
server work needed. It authenticates with Bearer tokens (`POST
/api/auth/login`), joins labs via `POST /api/lab/[id]/token`, registers push
tokens at `/api/notifications/devices`, and settles checkout through the
`mojo://` deep link + JSON verify. The full client contract lives in
`libs/shared/api-contract` (paths, `{ok,…}` envelopes, deep-link parsing).

1. `npm install -g eas-cli && eas login`, then `eas build:configure` inside
   `apps/mobile` (the `eas.json` profiles already exist).
2. Point the app at the production hub: today the sign-in screen carries an
   editable hub-URL field (dev default derives from the Expo host); before
   store submission, bake the production URL in via app config
   (`EXPO_PUBLIC_HUB_URL` → `defaultHubUrl`) so release builds never prompt.
3. `eas build --platform all --profile production`, then `eas submit`.
   Push needs a physical device + Expo push credentials (`eas credentials`);
   LiveKit video needs a dev/native build (it cannot run in Expo Go).
4. Store fees are the one unavoidable cost: Apple Developer ($99/yr) +
   Google Play ($25 one-time). Everything else on this page is $0.