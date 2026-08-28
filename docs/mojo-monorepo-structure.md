# Mojo — Nx Monorepo Structure

How the modules from the modular-monolith doc map onto an actual Nx workspace, with
Next.js as the app framework, shadcn/ui as the component source, and clean
TypeScript contracts underneath the business logic.

---

## Top-level layout

```
mojo/
├── apps/
│   ├── web/                 # Next.js — student + tutor marketplace (one app,
│   │                        #   role-aware layouts after login)
│   └── admin/                # Next.js — admin, deployed and reasoned about
│                              #   separately given its trust boundary
├── libs/
│   ├── shared/
│   │   ├── ui/                # shadcn/ui components + Mojo design tokens
│   │   ├── util/               # cn(), date/timezone helpers, formatting
│   │   ├── domain/             # cross-module value objects (Money, TimeRange…)
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

Two apps, not three. Student and Tutor share too much — auth, the lab,
messaging, notifications UI — to justify separate deployments, and their
dashboards are just different views composed from the same feature libs. Admin
stands alone because it has a different trust boundary (see the permissions
matrix's note on `admin_role.assign` and `wallet.manual_adjust`) and benefits from
shipping on its own cadence without every admin-panel change triggering a rebuild
of the public app.

No `apps/api` yet — see *Where mobile fits* below for why that's a deliberate
deferral, not an oversight.

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
shared/ui.** Enforce it with Nx's module boundary rule (`@nx/enforce-module-
boundaries`), tagging each project (`type:domain`, `type:application`,
`type:infrastructure`, `type:feature`, `scope:scheduling`, etc.) and configuring
`depConstraints` in `.eslintrc` so a `type:domain` project physically cannot import
a `type:infrastructure` one — this is what turns the modular monolith from a
convention people can forget into something the build fails on.

Every other module in `libs/` gets the same four sub-libraries. Some are thinner
than `scheduling` — `lab` is mostly `infrastructure` (a wrapper around a
video SDK) with barely any `domain` — but the shape stays consistent so a new
module is always structured the way the last one was.

---

## A concrete domain contract

What "clean TypeScript domain contracts" actually looks like, using `pricing` —
the module the roadmap flagged as needing to be pure, I/O-free logic:

```typescript
// libs/pricing/domain/src/pricing.types.ts — pure domain, zero dependencies

export type TutorLevel = 'entry' | 'established' | 'expert';

export interface Money {
  readonly amountKobo: number;   // store the smallest unit, never a float
  readonly currency: 'NGN' | 'USD';
}

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
}

// Pure function — no I/O, fully unit-testable with plain objects.
export function calculateLessonCharge(
  segments: number,
  rate: SegmentRate,
  takeHomePercent: number,
): CommissionSplit {
  const totalKobo = segments * rate.perSegment.amountKobo;
  const tutorKobo = Math.round(totalKobo * (takeHomePercent / 100));
  return {
    total: { amountKobo: totalKobo, currency: rate.perSegment.currency },
    tutorTakeHome: { amountKobo: tutorKobo, currency: rate.perSegment.currency },
    platformCommission: {
      amountKobo: totalKobo - tutorKobo,
      currency: rate.perSegment.currency,
    },
  };
}
```

```typescript
// libs/pricing/application/src/record-session-completion.use-case.ts
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
handler somewhere in `apps/web`.

---

## shadcn/ui placement

shadcn isn't an npm dependency — it's components generated into your own repo. Point
its CLI at the shared lib instead of an app:

```jsonc
// components.json, at the workspace root
{ "aliases": { "components": "@mojo/shared/ui", "utils": "@mojo/shared/util" } }
```

Every `shadcn add <component>` lands in `libs/shared/ui`, both apps import from
`@mojo/shared/ui`, and the Mojo tokens (`globals.css` from the design system doc)
live in that same lib as the single source of truth both apps' Tailwind configs
point back to.

---

## Where mobile fits (Phase 4, not now)

The reason business logic lives entirely in `application/` use-cases rather than
inside Next.js Server Actions: when the native app from Phase 4 shows up, it needs
the *same* `bookSession`, `calculateLessonCharge`, and `submitReview` logic the web
app uses — not a reimplementation. The plan for that day is a thin `apps/api`
(tRPC or REST route handlers) that does nothing but call the same `application`
layer libs Server Actions already call. Nothing about the module structure has to
change to support that later — which is the actual payoff of doing the layering
this way now, while it's still just one developer and one app.
