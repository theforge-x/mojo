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
   It is **fully isolated**: it may import only `@mojo/shared/*` and its own module —
   never Prisma/Next.js/frameworks, never its own `application`/`infrastructure`/
   `feature`, and never another module (not even its `domain`). Cross-cutting
   concepts several domains need (e.g. `TutorLevel`) live in `@mojo/shared/domain`;
   a module that needs another module's data declares its **own local contract**
   (dependency inversion, e.g. booking's `BookingSession`) instead of importing it.
2. `application/` contains **use-case factories** (`make*`). It may import only
   `domain/` (own module), `@mojo/shared/domain`, `@mojo/shared/events`, and other
   modules' `domain` **contract types**. It must not import Prisma, other modules'
   `application`/`infrastructure`/`feature`, or `infrastructure/` itself.
3. `infrastructure/` implements `domain/` ports. It is the only layer allowed to
   import Prisma, the video SDK, or payment/notification HTTP clients. Like
   `application/`, it may consume another module's `domain` contract types but never
   its `application`/`infrastructure`/`feature`.
4. `feature/` is React; it imports `application/` and `@mojo/shared/ui`, never
   `infrastructure/`.

**Enforcement:** these rules **are machine-enforced** and gate the build. `npm run
build` runs `npm run lint:boundaries` first, which runs two ESLint rules over
`libs/**` and `apps/**`:

- `@nx/enforce-module-boundaries` (`eslint.config.mjs`) — the module-scope rule:
  each module carries a `scope:*` tag and may depend only on `@mojo/shared/*` plus
  its explicit peers (`discovery` → `pricing/domain`); no module may reach another
  module's `application`/`infrastructure`/`feature`.
- `@mojo/clean-architecture` (`tools/eslint/mojo-clean-architecture.mjs`) — the
  layer-direction rule: domain isolation, `domain <- application <- feature` and
  `domain <- infrastructure`, cross-module imports restricted to `domain` contract
  types (from `application`/`infrastructure`) and `@mojo/shared/events`, and Prisma
  confined to `infrastructure`.

Apps (`apps/**`) are the composition root and are exempt from the layer rule.

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

### 4.5 Payments (`release-payout`, `charge-student`, `quote-session-charge`, `refund-charge`)

- **W1** `releasePayout` throws `InsufficientBalanceError` if
  `wallet.balance.amountMinor < amount.amountMinor`.
- **W2** On success it publishes `PayoutRequested`, then invokes the rail
  (`send` → `{externalRef}`), then publishes `PayoutCompleted` with
  `rail: externalRef`.
- **W3** `WalletRepository.credit` applies the wallet increment and the ledger row
  atomically in a Prisma `$transaction`.
- **W4** `chargeStudent` requires a payment method (`NoPaymentMethodError`),
  rejects a second charge for the same session (`DuplicateChargeError`), and
  rejects a second non-refunded trial for the same student+tutor
  (`TrialAlreadyUsedError`). Amounts come from `quoteSessionCharge`
  (segments × rate, `TRIAL_PRICE_PERCENT = 50` when `isTrial`); the saved
  `StudentCharge` starts `captured`.
- **W5** `refundCharge` enforces ownership (`ChargeNotFoundError`), rejects
  `refunded` charges (`ChargeNotRefundableError`), and rejects over-refunds
  (`OverRefundError`); full-remaining refunds flip the charge to `refunded`,
  partial ones to `partially_refunded`.
- **W6** `StudentCharge`/`ChargeRefund` money is `Int` minor units
  (`totalMinor`, `amountMinor`); `sessionId` is unique on `StudentCharge`.

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
  it is event-driven (subscriber wiring happens at the composition root, `apps/**`).

---

## 5. Behavior contracts

1. **Session lifecycle** states: `booked → confirmed → completed | cancelled | no_show`;
   every transition appends a `SessionStatusEvent` row.
2. **Tutor application** states: `pending → in_review → approved | rejected`.
3. **Payout request** states: `pending → approved → completed | rejected` (string field).
4. **Mojo+ subscription** states: `active → cancelled`.
5. **Dispute** states: `open → upheld | dismissed`.
6. **Lesson subscription** states: `active → paused | cancelled`.
7. The **event catalog** is the **15 events** in `events.types.ts` (publisher →
   subscriber mapping in [04-behavioral §11](04-behavioral.md#11-event-catalog-as-defined-in-code)).
   `SessionNoShow` (`booking/mark-no-show`) and `DisputeResolved`
   (`trust-safety/resolve-dispute`) are now published. The only roadmap event
   absent from the catalog is `SessionRescheduled` (the thin
   `POST /api/sessions/[id]/reschedule` re-books + cancels with no event).

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
| `shared/domain` | ✅ value objects (`Money`, `TimeRange`, `TutorLevel`) | — | — | — | — | full |
| `shared/events` | ✅ EventBus + 15-event catalog | — | — | — | ✅ `event-bus.spec` | full |
| `shared/ui` | — | — | — | ✅ 5 components | — | full |
| `shared/util` | — | — | — | — | ✅ | full |
| `identity` | ✅ | ✅ register/authenticate | ✅ prisma + bcrypt | ✅ login-form | ✅ 3 specs | full |
| `scheduling` | ✅ | ✅ book/cancel/confirm/set-availability (+ thin route-level reschedule, no use-case) | ✅ prisma | ✅ calendar/editor | ✅ 5 specs | full |
| `pricing` | ✅ | ✅ record-session-completion | ✅ prisma tutor-level | — | ✅ 2 specs | full |
| `booking` | ✅ | ✅ confirm-delivery + mark-no-show | ✅ prisma | — | ✅ 1 spec | full |
| `lab` | ✅ | — | ✅ livekit | ✅ lab-room | ✅ 1 spec | full |
| `payments` | ✅ charges + wallet | ✅ release-payout + charge/quote/refund | ✅ prisma (wallet + charge) + paystack | — | ✅ 3 specs | full |
| `mojo-plus` | ✅ | ✅ 3 use-cases | ✅ prisma | — | ✅ 1 spec | full |
| `tutor-profile` | ✅ | ✅ submit/review-application | ✅ prisma | — | ✅ 2 specs | full |
| `tutor-performance` | ✅ | ✅ recompute-level | ✅ prisma | — | ✅ 2 specs | full |
| `discovery` | ✅ filters + availability-window | ✅ search-tutors | ✅ prisma + in-memory (both filter) | — | ✅ 3 specs | full |
| `billing` | ✅ | ✅ manage-subscription | ✅ prisma (methods + subscriptions) | — | ✅ 1 spec | full |
| `messaging` | ✅ | ✅ send/list-thread/record-interest | ✅ prisma | — | ✅ 3 specs | full |
| `reviews` | ✅ | ✅ submit-review | ✅ prisma | — | ✅ 1 spec | full |
| `referrals` | ✅ | ✅ track-referral | ✅ prisma | — | ✅ 1 spec | full |
| `trust-safety` | ✅ | ✅ file/resolve-dispute | ✅ prisma | — | ✅ 2 specs | full |
| `ai-learning` | ✅ | ✅ generate-recap | ✅ prisma | — | ✅ 1 spec | full |
| `notifications` | ✅ + scheduled-reminders | ✅ dispatch-notification | ✅ email + whatsapp | — | ✅ 2 specs | full |
| `admin-config` | ✅ | ✅ set-flag/list-subjects/append-audit-log | ✅ prisma | — | ✅ 1 spec | full |
| `analytics` | ✅ | ✅ compute-metrics/build-leaderboard | ✅ prisma | — | ✅ 1 spec | full |

**Key** — ✅ present in the tree; ❌ absent. All modules are **full-depth** with
38 spec files / 141 tests (`npx vitest run`). The workspace-test opt-in list is
`vitest.config.ts` `test.projects` (root registry; every lib with a
`vitest.config.ts` opts in). Reschedule remains the one route-level-only flow
(no domain use-case, no `SessionRescheduled` event); the architectural layer
rules in §2 apply uniformly and are enforced by `lint:boundaries`.

---

## 8. Composition root & gaps

The use-cases publish/subscribe through the application **composition
root** (`apps/hub/demo/composition-root.ts`, `apps/admin/demo/composition-root.ts`),
which wires ports to InMemory (demo) or Prisma (`USE_PRISMA=true`) adapters and
subscribes event handlers (`SessionBooked/Cancelled/Completed`,
`ReviewSubmitted`, `TutorLevelChanged`, …). In the current tree:

- `apps/hub` wires the full student loop: `scheduling.book` + `billing.charge`
  (`POST /api/sessions`), `scheduling.cancel` + `billing.refundForSession`
  (`POST /api/sessions/[id]/cancel`), `scheduling.confirmSession`
  (`POST …/start`), `booking.confirmDelivery` (`POST …/confirm`),
  `booking.markNoShow` (`POST …/no-show`), messaging (`/api/messages`),
  reviews (`/api/reviews`), charges/refunds (`/api/charges`), payouts
  (`/api/payouts`), availability, applications, notifications prefs + manual
  reminders. Event subscribers for pricing (commission split), payments (wallet
  credit), tutor-performance (recompute), and ai-learning (recap) all run on
  `SessionCompleted`.
- `apps/admin` renders `TutorApplication` rows from the hub-backed application
  queue (`getAdmin().applications.list()` — over the `HUB_URL` bridge in demo
  mode, Prisma directly otherwise); approve/reject posts back through the same
  path and publishes a `TutorProfile` on approval. Dispute file/resolve +
  `/trust/disputes` are admin-only.
- **Remaining gaps:** reschedule is route-level only (no use-case, no
  `SessionRescheduled` event, no charge move); hub-side dispute filing has no
  route/view; Mojo+ subscribe/custom-rate and payout history/threshold have
  use-cases + repos but no hub UI/API; reminders have no cron/worker and no
  calendar sync; completion is student-confirm only (no tutor complete /
  auto-confirm worker).
- Conformance caveats with the planning docs are flagged in
  [01-structural §3](01-structural.md#3-clean-architecture-layering-inside-a-module),
  [03-data-model §3](03-data-model.md#3-model-inventory-by-owning-module), and
  [04-behavioral §11](04-behavioral.md#11-event-catalog).
