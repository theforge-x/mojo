# Mojo

Nx monorepo for the Mojo tutoring marketplace — Next.js apps, shadcn/ui, and
19 domain modules following clean architecture (domain → application →
infrastructure → feature). See `assets/mojo-modules.md` and
`assets/mojo-monorepo-structure.md` from the planning docs for the reasoning behind
the shape of this repo; this README only covers running it.

## Layout

- `apps/hub` — student + tutor marketplace (Next.js)
- `apps/admin` — admin panel (Next.js, separate deploy)
- `libs/shared/*` — design tokens + shadcn components, utils, cross-module
  value objects, the in-process event bus
- `libs/<module>/{domain,application,infrastructure,feature}` — one folder
  per bounded module; see `assets/mojo-modules.md` for what each owns

Seven modules are implemented at full depth (identity, scheduling, pricing,
booking, lab, payments, mojo-plus) — domain logic, use-cases, Prisma
repositories, and tests. The remaining twelve are scaffolded at domain-type
depth so the full module boundary exists in the tree without pretending
every module got equal engineering time. Grep for `TODO` to find the seams.

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm dev:hub       # http://localhost:3003
pnpm dev:admin     # http://localhost:3000
pnpm test          # vitest, via the Nx test target on every project with one
pnpm lint          # biome check .
pnpm format        # biome format --write .
```

Copy `.env.example` to `.env` first — the LiveKit and payment-rail adapters
read straight from `process.env` (see `libs/lab/src/infrastructure`
and `libs/payments/src/infrastructure`).

## A note on this codebase's provenance

This tree was generated wholesale rather than built up feature by feature —
it exists to be read and extended, not deployed as-is. It has not been
installed, compiled, or run. Expect it to need real work before `pnpm dev:hub`
succeeds: dependency versions may need adjusting, a handful of modules only
have domain types with no wired-up persistence yet, and the event catalog in
`libs/shared/events` doesn't yet cover every event the scaffold modules'
TODO comments reference. Treat it as a strongly-opinionated starting
structure, not a finished product.
