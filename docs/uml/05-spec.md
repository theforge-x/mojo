# Mojo — 05. Formal Specification

A formal, code-derived specification of Mojo. Everything below is asserted **from
the source**, not from the planning docs. Where a plan differs, the divergence is
noted inline. This document is the normative reference for what the codebase
currently does.

---

## 1. Document scope & conformance

- **Scope:** `libs/**`, `apps/**`, `prisma/schema.prisma`.
- **Conformance basis:** each invariant cites its defining file/function. If a
  future change breaks an invariant below without updating this spec and the code,
  the change is out of conformance.
- Behavioral modeling of the in-process event flow assumes the composition root
  wires `eventBus.subscribe` as the planning docs describe; that wiring is the one
  part not present in the tree (see §7).

---

## 2. Architectural contract

### 2.1 Clean-architecture layering (per module)

1. `domain/` declares **types**, **ports** (interfaces), and **pure functions**.
   It must not import Prisma, Next.js, or any framework, and must not import its own
   module's `application`/`infrastructure`/`feature`.
2. `application/` contains **use-case factories** (`make*`). It may import only
   `domain/` (own module), `@mojo/shared/domain`, and `@mojo/shared/events`.
   It must not import Prisma or `infrastructure/`.
3. `infrastructure/` implements `domain/` ports. It is the only layer allowed to
   import Prisma, the video SDK, or payment/notification HTTP clients.
4. `feature/` is React; it imports `application/` and `@mojo/shared/ui`, never
   `infrastructure/`.

**Conformance caveat:** these rules are followed *by convention* in the code. They
are **not yet machine-enforced** — the Nx libraries carry only `scope:*` tags (no
`type:*`), and `biome.json` has no dependency-constraint rules. The `lab` feature
component imports `libs/lab/src/feature` from the hub app via a bare relative path
(`apps/hub/app/(tutor)/lab/[sessionId]/page.tsx:1`), which bypasses the `@mojo/*`
path-alias boundary — see the structural doc's `[divergence]`.

### 2.2 Modular-monolith & event usage

- One Postgres database, one consolidated schema (`prisma/schema.prisma`).
- Cross-module **reactions** run on the shared in-process `EventBus` singleton
  (`libs/shared/events/src/event-bus.ts`); modules never call another module's
  `infrastructure` and never reach into another module's tables directly.
- `tutor-performance` is **derived data only** — it must not be written to directly;
  it is built from session/review events (see §5.6).

---

## 3. Data model rules (Prisma)

1. Every entity has a `cuid()` default primary key unless it is a natural key
   (`FeatureFlag.key`, `ReferralLink.code`) or a 1:1 FK-as-PK
   (`TutorProfile.tutorId`, `TutorPerformance.tutorId`, `Wallet.tutorId`,
   `MojoPlusSubscription.tutorId`, `SchedulingSettings.tutorId`,
   `DeliveryConfirmation.sessionId`, `LessonRecap.sessionId`).
2. `User.email` is unique; `Review.sessionId` and `Dispute.sessionId` are unique (1:1).
3. Money columns are `Int` in the minor unit (`Wallet.balanceMinor`,
   `WalletTransaction.amountMinor`, `PayoutRequest.amountMinor`,
   `MojoPlusSubscription.customSegmentRateMinor`) and map to the `Money` value
   object. **No floats for money.**
4. `AvailabilityRule.weekday` is `Int` 0–6 matching JS `Date`; time-of-day is
   `startMinute`/`endMinute` minutes since midnight in the tutor's timezone.
   `AvailabilityException.date` is `YYYY-MM-DD` in the tutor's timezone.
5. `Session` stores `startAt`/`endAt` as `DateTime` (UTC); the domain projects these
   to `startIso`/`endIso` strings. `segmentsBetween` derives segment count with
   `ceil(durationMinutes / 15)` (`libs/shared/util/src/date.ts`).
6. String-backed enums carry documented value sets (see §2 of
   [03-data-model](03-data-model.md#4-money--identity-mapping-conventions)).

---

## 4. Domain invariants

### 4.1 Identity (`password-policy.ts`, `register-user`, `authenticate-user`)

- **P1** A password is valid iff: length ≥ 10 AND contains ≥ 1 uppercase AND ≥ 1
  digit AND no whitespace. (`checkPasswordPolicy` returns `{valid, reasons}`; reasons
  list **all** violations, not just the first.)
- **P2** `registerUser` rejects with `WeakPasswordError` when `P1` fails, before any
  persistence.
- **P3** `registerUser` rejects with `EmailAlreadyRegisteredError` if `findByEmail`
  returns an existing user.
- **P4** `authenticateUser` returns `InvalidCredentialsError` for both unknown email
  and wrong password (does not reveal which).
- **P5** `authenticateUser` rejects a suspended account (`suspendedAt` non-null) even
  with valid credentials (`AccountSuspendedError`).

### 4.2 Scheduling & booking (`conflict-detection.ts`, `book-session`, `cancel-session`)

- **S1** A candidate slot conflicts iff it overlaps any existing session in
  `booked` or `confirmed` status (`hasConflict`); `cancelled`/`completed`/`no_show`
  sessions are ignored.
- **S2** `withinNoticeWindow(start, now, min)` is false when
  `now + min` is after `start`.
- **S3** `respectsBuffer(candidate, existing, buffer)` requires the candidate to be
  non-overlapping after padding each existing session by `bufferMinutes` on both sides.
- **S4** `bookSession` enforces, **in order**: (a) not paused → (b) within notice →
  (c) no conflict → (d) respects buffer; each failure throws
  `SchedulingConflictError(reason)`. A successful booking is saved with
  `status: 'booked'` and its `statusHistory` seeded with `{status:'booked', at:now}`,
  then `SessionBooked` is published.
- **S5** `cancelSession` throws `SessionNotFoundError` if the session does not exist;
  otherwise transitions to `cancelled`, appends the status history entry, and
  publishes `SessionCancelled`.

### 4.3 Booking / delivery (`confirm-delivery`)

- **B1** `confirmDelivery` throws `SessionNotBookedError` if the session id has no row.
- **B2** On success it `markCompleted`s the session, saves a `DeliveryConfirmation`,
  computes `segmentCount` (ceil/15 min), publishes `SessionCompleted`, then
  publishes `SessionDeliveryConfirmed`.
- **B3** The `SessionCompleted.rate` is `0` minor units for a trial session, else a
  default of `600000` NGN (`confirm-delivery.use-case.ts:44`). A zero rate is how
  `pricing` detects a trial.
- **B4** `AUTO_CONFIRM_WINDOW_HOURS = 48` is the auto-confirm constant referenced by
  the payout-release rule.

### 4.4 Pricing & commission (`calculate-lesson-charge.ts`, `pricing.types.ts`)

- **M1** `money()` throws on non-integer `amountMinor` — money is never stored as float.
- **M2** `BASE_TAKE_HOME_PERCENT = { entry:50, established:60, expert:70 }`;
  `MOJO_PLUS_BONUS_PERCENT = 10`; `effectiveTakeHomePercent(base, hasMojoPlus)`
  adds the bonus iff subscribed.
- **M3** `calculateLessonCharge(segments, rate, takeHome)`:
  `total = segments × rate.perSegment.amountMinor`;
  `tutorTakeHome = percentOf(total, takeHome)`;
  `platformCommission = total − tutorTakeHome`. Invariant:
  `tutorTakeHome + platformCommission == total`.
- **M4** `calculateTrialLessonCharge` always yields `tutorTakeHome = 0`,
  `platformCommission = total` (trial pays the tutor ₦0).
- **M5** `recordSessionCompletion` selects the per-segment rate as
  `customRateMinor ?? DEFAULT_SEGMENT_RATE_NGN[level]` (Mojo+ custom rate overrides the
  level default) and sets `isCustom = customRateMinor !== null`. Payment for a lesson
  reads the tutor's **current** level/Mojo+ state at completion event time (the
  roadmap's "price locked at booking time" is not yet enforced in code — see §5.7).

### 4.5 Payments (`release-payout`, `wallet.types.ts`)

- **W1** `releasePayout` throws `InsufficientBalanceError` if
  `wallet.balance.amountMinor < amount.amountMinor`.
- **W2** On success it publishes `PayoutRequested`, then invokes the rail
  (`send` → `{externalRef}`), then publishes `PayoutCompleted` with
  `rail: externalRef`.
- **W3** `WalletRepository.credit` applies the wallet increment and the ledger row
  atomically in a Prisma `$transaction`.

### 4.6 Mojo+ (`subscribe-mojo-plus`)

- **MP1** `setCustomRate` throws `MojoPlusRequiredError` unless an **active**
  subscription exists for the tutor.
- **MP2** `subscribeMojoPlus` saves `status:'active'`, `customSegmentRateMinor:null`,
  and publishes `MojoPlusSubscribed`.
- **MP3** `cancelMojoPlus` flips to `cancelled`, sets `cancelledAt`, and publishes
  `MojoPlusCancelled` (no-op if no subscription exists).

### 4.7 Tutor performance / level (`tutor-performance`)

- **TP1** `computeLevel(perf)`: `expert` if `hours ≥ 200 && rating ≥ 4.7`;
  `established` if `hours ≥ 50 && rating ≥ 4.5`; else `entry`
  (`LEVEL_THRESHOLDS` in `tutor-performance.types.ts`).
- **TP2** `recomputeLevel` only persists + publishes `TutorLevelChanged` when the
  computed level differs from the current one. It never derives from direct writes —
  it is event-driven (scaffold: subscriber wiring at composition root).

---

## 5. Behavior contracts

1. **Session lifecycle** states: `booked → confirmed → completed | cancelled | no_show`;
   every transition appends a `SessionStatusEvent` row.
2. **Tutor application** states: `pending → in_review → approved | rejected`.
3. **Payout request** states: `pending → approved → completed | rejected` (string field).
4. **Mojo+ subscription** states: `active → cancelled`.
5. **Dispute** states: `open → upheld | dismissed`.
6. **Lesson subscription** states: `active → paused | cancelled`.
7. The **event catalog** is the 12–13 events in `events.types.ts` (publisher →
   subscriber mapping in [04-behavioral §11](04-behavioral.md#11-event-catalog)).
   Events referenced in TODO comments but absent from the catalog:
   `TutorApplicationSubmitted/Approved/Rejected`, `SessionRescheduled`,
   `ReferralConverted`.

---

## 6. External integrations

| Integration | Adapter (file) | Protocol | Seam (port) |
|---|---|---|---|
| Postgres | `prisma/schema.prisma`; repos in each module `infrastructure/` | Prisma ORM | module `*Repository` ports |
| LiveKit | `libs/lab/src/infrastructure/livekit-lab.adapter.ts` | JWT AccessToken (server SDK) | `LabProvider` |
| Paystack Transfers | `libs/payments/src/infrastructure/paystack.adapter.ts` | REST `POST /transfer` | `PayoutRail` |
| Resend (email) | `libs/notifications/src/infrastructure/email.adapter.ts` | REST | `NotificationDispatcher` (partial) |
| WhatsApp Cloud | `libs/notifications/src/infrastructure/whatsapp.adapter.ts` | REST template messages | `NotificationDispatcher` (partial) |

All secrets/keys come from `process.env` (see `.env.example`):
`DATABASE_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, Paystack/Resend
/WhatsApp keys. No secret is committed.

---

## 7. Implementation-depth matrix

| Module | domain | application | infrastructure | feature | tests | depth |
|---|---|---|---|---|---|---|
| `shared/domain` | ✅ value objects | — | — | — | — | full |
| `shared/events` | ✅ EventBus + catalog | — | — | — | ✅ `event-bus.spec` | full |
| `shared/ui` | — | — | — | ✅ 5 components | — | full |
| `shared/util` | — | — | — | — | — | full |
| `identity` | ✅ | ✅ register/authenticate | ✅ prisma + bcrypt | ✅ login-form | ✅ 2 specs | **full** |
| `scheduling` | ✅ | ✅ book/cancel/set-availability | ✅ prisma | ✅ calendar/editor | ✅ 2 specs | **full** |
| `pricing` | ✅ | ✅ record-session-completion | ✅ prisma tutor-level | — | ✅ 2 specs | **full** |
| `booking` | ✅ | ✅ confirm-delivery | ✅ prisma | — | ✅ 1 spec | **full** |
| `lab` | ✅ | — | ✅ livekit | ✅ lab-room | ✅ 1 spec | **full** |
| `payments` | ✅ | ✅ release-payout | ✅ prisma + paystack | — | ✅ 1 spec | **full** |
| `mojo-plus` | ✅ | ✅ 3 use-cases | ❌ none | — | ✅ 1 spec | full (no infra) |
| `tutor-profile` | ✅ | ✅ submit-application | ❌ | — | — | scaffold |
| `tutor-performance` | ✅ | ✅ recompute-level | ❌ | — | — | scaffold |
| `discovery` | ✅ | ✅ search-tutors | ❌ | — | — | scaffold |
| `billing` | ✅ | ✅ manage-subscription | ❌ | — | — | scaffold |
| `messaging` | ✅ | ✅ send-message | ❌ | — | — | scaffold |
| `reviews` | ✅ | ✅ submit-review | ❌ | — | — | scaffold |
| `referrals` | ✅ | ✅ track-referral | ❌ | — | — | scaffold |
| `trust-safety` | ✅ | ✅ file-dispute | ❌ | — | — | scaffold |
| `ai-learning` | ✅ | ✅ generate-recap | ❌ | — | — | scaffold |
| `notifications` | ✅ | ❌ | ✅ email/whatsapp | — | — | partial |
| `admin-config` | ✅ | ❌ | ❌ | — | — | domain-only |
| `analytics` | ✅ | ❌ | ❌ | — | — | domain-only |

**Key** — ✅ present in the tree; ❌ absent. "Full" = has use-cases + repository +
tests earning a `vitest.config.ts` (the workspace-test opt-in list in
`vitest.workspace.ts`). `mojo-plus` is full-depth on tests but lacks infrastructure;
`notifications`/`admin-config`/`analytics` are noted as partial because they lack the
application/orchestration layer. All "scaffold" modules' repositories and tests are
absent, matching `README.md`'s provenance note.

---

## 8. Composition root & gaps

The use-cases that publish/subscribe only work once the application **composition
root** (in `apps/`) calls `eventBus.subscribe` with the relevant handlers and wires
ports to Prisma adapters. In the current tree:

- `apps/hub` wires `bookSession`/`cancelSession`-style orchestration only to the
  extent shown in scaffold server components (e.g. `(tutor)/home/page.tsx` returns
  hard-coded sessions; the lab page constructs `LiveKitLabProvider` directly).
- `apps/admin` renders `TutorApplication` rows from a hard-coded array.
- **No module's use-case is wired to a real HTTP/session flow yet.** The event
  subscribers for `pricing`, `payments`, `tutor-performance`, etc. are not present.
- Conformance caveats with the planning docs are flagged in
  [01-structural §3](01-structural.md#3-clean-architecture-layering-inside-a-module),
  [03-data-model §3](03-data-model.md#3-model-inventory-by-owning-module), and
  [04-behavioral §11](04-behavioral.md#11-event-catalog).
