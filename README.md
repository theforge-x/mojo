# Mojo

Nx monorepo for the Mojo tutoring marketplace — Next.js apps, shadcn/ui, and
19 domain modules following clean architecture (domain → application →
infrastructure → feature). See `docs/mojo-modules.md` and
`docs/mojo-monorepo-structure.md` for the reasoning behind the shape of this
repo; this README only covers running it.

## Layout

- `apps/hub` — student + tutor marketplace (Next.js)
- `apps/admin` — admin panel (Next.js, separate deploy)
- `libs/shared/*` — design tokens + shadcn components, utils, cross-module
  value objects (`Money`, `TimeRange`, `TutorLevel`), the in-process event bus
- `libs/<module>/{domain,application,infrastructure,feature}` — one folder
  per bounded module; see `docs/mojo-modules.md` for what each owns

Every module is implemented at **full depth** — domain logic, use-cases, Prisma
repositories, and Vitest tests (23 spec files / 72 tests). Module boundaries are
**machine-enforced**: `npm run lint:boundaries` runs the Nx module-scope rule plus
a custom clean-architecture layer rule (domains depend only on `@mojo/shared/*`;
cross-module access is restricted to `domain` contract types and the event bus;
Prisma lives only in `infrastructure`), and `npm run build` runs it first so
boundary violations fail the build.

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm dev:hub       # http://localhost:3003
pnpm dev:admin     # http://localhost:3000
pnpm test          # npx vitest run — the Nx test target runs vitest in watch mode
pnpm lint:boundaries  # eslint module + clean-architecture boundaries
pnpm lint          # biome check . && lint:boundaries
pnpm build         # lint:boundaries && nx run-many --target=build --all
```

Copy `.env.example` to `.env` first — the LiveKit and payment-rail adapters
read straight from `process.env` (see `libs/lab/src/infrastructure`
and `libs/payments/src/infrastructure`).

## A note on this codebase's provenance

This tree was generated wholesale rather than built up feature by feature —
it exists to be read and extended, not deployed as-is. It has not been
installed, compiled, or run in production. Expect it to need real work before
`pnpm dev:hub` succeeds: dependency versions may need adjusting, a handful of
tables have no repository yet (`PaymentMethod`, `PracticeItem`), the composition
root (`apps/**`) has not wired every module's use-cases to HTTP flows or event
subscribers, and two typed events (`SessionNoShow`, `DisputeResolved`) are not
yet published. Treat it as a strongly-opinionated starting structure, not a
finished product.
