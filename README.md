# Mojo

Nx monorepo for the Mojo tutoring marketplace — Next.js apps, shadcn-style UI,
and 19 domain modules following clean architecture (domain → application →
infrastructure → feature). See `docs/mojo-modules.md` and
`docs/mojo-monorepo-structure.md` for the reasoning behind the repo shape; this
README covers running it.

## Layout

- `apps/hub` — student + tutor marketplace (Next.js)
- `apps/admin` — admin ops console (Next.js, separate deploy)
- `libs/shared/*` — design tokens + components, utils, cross-module value
  objects (`Money`, `TimeRange`, `TutorLevel`), the in-process event bus
- `libs/<module>/{domain,application,infrastructure,feature}` — one folder per
  bounded module; see `docs/mojo-modules.md` for what each owns

Modules are implemented at **full depth** — domain logic, use-cases, Prisma
repositories, and Vitest tests (25 spec files / 80 tests). Boundaries are
**machine-enforced**: `npm run lint:boundaries` runs the Nx module-scope rule
plus a custom clean-architecture layer rule (domains depend only on
`@mojo/shared/*`; cross-module access is restricted to `domain` contract types
and the event bus; Prisma lives only in `infrastructure`), and `npm run build`
runs it first so violations fail the build.

## Running locally

```bash
npm install
npm run prisma:generate
cp .env.example .env        # defaults are demo-mode: no infra required
npm run dev:hub             # http://localhost:3003
npm run dev:admin           # http://localhost:3000

npm test                    # npx vitest run (25 files / 80 tests)
npm run lint:boundaries     # module + clean-architecture boundaries
npm run lint                # biome check + lint:boundaries
npm run build               # lint:boundaries + nx run-many --target=build --all
```

### Demo mode vs Prisma

`USE_PRISMA` (in `.env`) flips persistence:

- **Unset / `false` (default)** — in-memory demo roots (`apps/hub/demo`,
  `apps/admin/demo`) seed a `DemoState`; nothing else is needed to run.
- **`true`** — the same use-cases run against Prisma repositories. Requires a
  reachable Postgres (`DATABASE_URL`) and `npx prisma migrate deploy`. See
  `docs/deployment.md` for the free-tier setup (Supabase).

### Demo accounts — password `Password123`

| Role | Email | Starts at |
|---|---|---|
| Tutor | `tutor@mojo.dev` | `/tutor` |
| Student | `student@mojo.dev` | `/` |
| Admin | `admin@mojo.dev` | admin app `/nexus` |

The `admin@mojo.dev` account belongs to the **admin app**; the hub's
`/login` lists its own two demo accounts.

## The core flow

Auth → find a tutor → book → start/join the lab → charge on completion is
wired end to end through the composition roots. Walk it step by step in
`docs/mojo-flow.md`; in short:

1. **Sign in** via server action `loginWithDemo`; httpOnly cookies
   (`mojo_user` token + `mojo_role`) gate `/tutor/*`, `/tutors/*`, `/lab/*`.
2. **Find a tutor** (`/tutors`) via `makeSearchTutors`.
3. **Book** a slot (`POST /api/sessions`) via `makeBookSession` → status `booked`.
4. **Start the lab** — tutor taps **Start live lab** (`makeConfirmSession`,
   `booked → confirmed`) then opens `/tutor/lab/[sessionId]`; the student joins
   the same LiveKit room from `/lab/[sessionId]`.
5. **Charge** — student confirms delivery (`makeConfirmDelivery` →
   `SessionCompleted`): the hub credits the tutor wallet, recomputes level,
   generates an AI recap, and marks the payout eligible; the tutor withdraws
   via `POST /api/payouts` (`makeReleasePayout`).

## CI/CD & deployment

`.github/workflows/ci.yml` runs checks on every push/PR (Prisma generate,
boundary lint, vitest, per-app `tsc`, production builds) and, on `main`, deploys
both apps to Vercel Hobby. The whole stack is free-tier — Vercel, Supabase,
LiveKit Cloud, Resend, Paystack sandbox, GitHub Actions. See
`docs/deployment.md` for setup.