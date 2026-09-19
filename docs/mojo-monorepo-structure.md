# Mojo — Nx Monorepo Structure

How the modules from the modular-monolith doc map onto an actual Nx workspace, with
Next.js as the app framework, shadcn/ui as the component source, and clean
TypeScript contracts underneath the business logic.

---

## Top-level layout

```
mojo/
├── apps/
│   ├── hub/                 # Next.js — student + tutor marketplace (one app,
│   │                        #   role-aware layouts after login) + the JSON API
│   │                        #   the mobile client calls
│   ├── admin/                # Next.js — admin, deployed and reasoned about
│   │                         #   separately given its trust boundary
│   └── mobile/               # Expo (React Native) — student client: auth,
│                             #   sessions, lab video, push, checkout loop
├── libs/
│   ├── shared/
│   │   ├── ui/                # shadcn/ui components + Mojo design tokens
│   │   ├── util/               # cn(), date/timezone helpers, formatting
│   │   ├── domain/             # cross-module value objects (Money, TimeRange…)
│   │   ├── api-contract/       # hub↔mobile HTTP contract: route paths,
│   │   │                       #   `{ok,…}` envelopes, deep-link parsing
│   │   └── events/             # domain event contracts + the in-process bus
│   ├── identity/
│   ├── tutor-profile/
│   ├── tutor-performance/
│   ├── discovery/
│   ├── scheduling/
│   ├── booking/
│   ├── lab/
│   ├── pricing/
│   ├── mojo-plus/
│   ├── payments/
│   ├── billing/
│   ├── messaging/
│   ├── reviews/
│   ├── referrals/
│   ├── trust-safety/
│   ├── ai-learning/
│   ├── notifications/
│   ├── admin-config/
│   └── analytics/
├── nx.json
├── tsconfig.base.json
└── package.json
```

Three apps, each on its own cadence. Student and Tutor share the hub — auth,
the lab, messaging, notifications UI — because their dashboards are just
different views composed from the same feature libs. Admin stands alone
because it has a different trust boundary (see the permissions
matrix's note on `admin_role.assign` and `wallet.manual_adjust`) and benefits from
shipping on its own cadence without every admin-panel change triggering a rebuild
of the public app. Mobile (`apps/mobile`, Expo) stands alone because it is a
different runtime entirely (native UI, EAS builds) and talks to the hub over
HTTP, never by importing its code — the reuse channel is `libs/` pure-domain
modules plus the `api-contract` lib both sides type against.

No `apps/api` — the hub's `app/api` REST routes *are* the API the mobile
client calls (Bearer sessions, `{ok,…}` envelopes), so no separate API surface
was ever needed.

---

## Inside a module: the clean-architecture layers

Every module in `libs/` follows the same four-layer shape. Using `scheduling` as
the concrete example:

```
libs/scheduling/
├── domain/            # pure TS — types, ports, domain logic. No Prisma. No
│                       #   Next.js. No framework imports of any kind.
│   src/
│     availability.types.ts
│     session.types.ts
│     scheduling.ports.ts     # repository *interfaces*, not implementations
│     conflict-detection.ts   # pure functions — this is what gets unit tested
├── application/        # use-cases that orchestrate domain logic through the
│                       #   ports — still framework-agnostic
│   src/
│     book-session.use-case.ts
│     cancel-session.use-case.ts
├── infrastructure/     # the only layer allowed to import Prisma, the video
│                       #   SDK, WhatsApp/email clients, etc. — implements the
│                       #   ports domain/ defined
│   src/
│     prisma-scheduling.repository.ts
└── feature/            # React — calendar UI, availability editor. Imports
                        #   application/ and shared/ui, nothing from
                        #   infrastructure/ directly.
    src/
      availability-editor.tsx
      calendar-view.tsx
```

The dependency rule that makes this "clean" rather than just a folder convention:
**domain imports nothing from this module's other layers; application imports only
domain; infrastructure implements domain's ports; feature imports application and
shared/ui.**

**Enforcement (as built).** These rules no longer rely on convention —
`eslint.config.mjs` configures `@nx/enforce-module-boundaries` (each module tagged
`scope:*` may depend only on `@mojo/shared/*` plus its declared peers) and a custom
`@mojo/clean-architecture` layer rule (`tools/eslint/mojo-clean-architecture.mjs`)
that enforces domain isolation, the inward layer direction, cross-module access
through `domain` contract types and the event bus, and Prisma confined to
`infrastructure`. `npm run lint:boundaries` runs both; `npm run build` runs it
first, so a boundary violation fails the build. Modules use the code layout
`libs/<module>/src/{domain,application,infrastructure,feature}/` (not sub-libraries
with separate tsconfigs) — the layering is enforced by these lint rules, not by
project separation.

Every other module in `libs/` gets the same four sub-libraries. Some are thinner
than `scheduling` — `lab` is mostly `infrastructure` (a wrapper around a
video SDK) with barely any `domain` — but the shape stays consistent so a new
module is always structured the way the last one was.

---

## A concrete domain contract

What "clean TypeScript domain contracts" actually looks like, using `pricing` —
the module the roadmap flagged as needing to be pure, I/O-free logic:

```typescript
// libs/pricing/src/domain/pricing.types.ts — pure domain, zero dependencies
// (as built: `TutorLevel` and `Money` now live in `@mojo/shared/domain` so that
//  several modules share them without importing each other's domain.)

export interface SegmentRate {
  readonly level: TutorLevel;
  readonly perSegment: Money;
  readonly isCustom: boolean;    // true only when set via Mojo+
}

export interface CommissionSplit {
  readonly total: Money;
  readonly tutorTakeHome: Money;
  readonly platformCommission: Money;
}

// A port — the *interface* this module needs from the outside world.
// pricing/infrastructure implements this; pricing/domain never imports Prisma.
export interface TutorLevelReader {
  getLevel(tutorId: string): Promise<TutorLevel>;
  hasMojoPlus(tutorId: string): Promise<boolean>;
  getCustomRateMinor(tutorId: string): Promise<number | null>;
}

// Pure function — no I/O, fully unit-testable with plain objects.
export function calculateLessonCharge(
  segments: number,
  rate: SegmentRate,
  takeHomePercent: number,
): CommissionSplit {
  const totalMinor = segments * rate.perSegment.amountMinor;
  const tutorMinor = Math.round(totalMinor * (takeHomePercent / 100));
  return {
    total: { amountMinor: totalMinor, currency: rate.perSegment.currency },
    tutorTakeHome: { amountMinor: tutorMinor, currency: rate.perSegment.currency },
    platformCommission: {
      amountMinor: totalMinor - tutorMinor,
      currency: rate.perSegment.currency,
    },
  };
}
```

```typescript
// libs/pricing/src/application/record-session-completion.use-case.ts
// Orchestrates domain logic via ports — still no Prisma import here.

import { calculateLessonCharge, TutorLevelReader } from '@mojo/pricing/domain';
import { SessionCompleted } from '@mojo/shared/events';

export function makeRecordSessionCompletion(levels: TutorLevelReader) {
  return async function recordSessionCompletion(event: SessionCompleted) {
    const [level, hasMojoPlus] = await Promise.all([
      levels.getLevel(event.tutorId),
      levels.hasMojoPlus(event.tutorId),
    ]);
    const takeHome = TAKE_HOME_TABLE[level] + (hasMojoPlus ? 10 : 0);
    return calculateLessonCharge(event.segmentCount, event.rate, takeHome);
  };
}
```

The trial-lesson rule (tutor always earns ₦0) and the "price locked at booking
time, not recalculated on level change" rule from the roadmap both belong in this
same `domain` layer as explicit, tested cases — not as an `if` buried in a route
handler somewhere in `apps/hub`.

---

## shadcn/ui placement

shadcn isn't an npm dependency — it's components generated into your own repo. Point
its CLI at the shared lib instead of an app:

```jsonc
// components.json, at the workspace root
{ "aliases": { "components": "@mojo/shared/ui", "utils": "@mojo/shared/util" } }
```

Every `shadcn add <component>` lands in `libs/shared/ui`, hub + admin import from
`@mojo/shared/ui` (mobile is React Native and keeps its own components), and the Mojo tokens (`globals.css` from the design system doc)
live in that same lib as the single source of truth both apps' Tailwind configs
point back to.

---

## Where mobile fits (as built)

The reason business logic lives entirely in `application/` use-cases rather than
inside Next.js Server Actions is exactly what the mobile client now relies on —
with one adjustment to the old plan. There is no thin `apps/api`: the hub's own
`app/api` REST routes *are* the mobile API (Bearer sessions, `{ok,…}` envelopes
on `POST /api/auth/*`, `GET /api/sessions`, `POST /api/lab/[id]/token`,
device registry, JSON payment verify). `apps/mobile` (Expo, `type:app` like the
web apps) calls those routes over HTTP and types every call through
`libs/shared/api-contract`, so a hub route change that breaks mobile fails in
types/specs instead of at runtime. Nothing about the module structure had to
change to support it — which was the actual payoff of the layering.
