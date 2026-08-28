# Mojo — 04. Behavioral Diagrams

Behavior of the Mojo codebase as built: the state machines declared by the enums,
the interaction flows implemented by the use-cases and adapters, the booking
activity tree, and the concrete event catalog that exists in `libs/shared/events`.

All states below are the **actual enum values / string sets** in
`prisma/schema.prisma` and the domain types — not aspirational.

---

## 1. Session lifecycle (state diagram)

The `SessionStatus` enum: `booked → confirmed → completed | cancelled | no_show`.
Confirmed/completed transitions are driven by the booking use-cases; every status
change appends a row to `SessionStatusEvent` (the `statusHistory`).

```mermaid
stateDiagram-v2
    [*] --> booked : bookSession() publishes SessionBooked
    booked --> confirmed
    booked --> cancelled : cancelSession() publishes SessionCancelled
    confirmed --> completed : confirmDelivery() publishes SessionCompleted + SessionDeliveryConfirmed
    confirmed --> no_show : markNoShow()
    confirmed --> cancelled : cancelSession()
    completed --> [*]
    cancelled --> [*]
    no_show --> [*]
```

> The `session.mark_complete`, `mark_no_show`, `reschedule` actions from the
> permissions matrix are partly represented (only `confirmDelivery`/`markNoShow` have
> booking-layer code; `markNoShow` writes `no_show` and is only stubbed in the
> repository). `reschedule` has **no** use-case yet.

---

## 2. Tutor application (state diagram)

`TutorApplication`'s `ApplicationStatus` enum. Only `submitApplication` exists in
code (writes a `pending` application); the review-queue transitions are admin-side
and not implemented.

```mermaid
stateDiagram-v2
    [*] --> pending : submitApplication() (scaffold)
    pending --> in_review
    in_review --> approved
    in_review --> rejected
    approved --> [*]
    rejected --> [*]
```

---

## 3. Payout request (state diagram)

`PayoutRequest.status` is a string field with value set
`pending | approved | completed | rejected`. Only `makeReleasePayout` drives part of
this (publishes `PayoutRequested` then `PayoutCompleted`); the manual approval step
is admin-side and not implemented in code.

```mermaid
stateDiagram-v2
    [*] --> pending : releasePayout() publishes PayoutRequested
    pending --> approved
    approved --> completed : publishes PayoutCompleted (via rail send)
    approved --> rejected
    completed --> [*]
    rejected --> [*]
```

---

## 4. Other stateful entities

```mermaid
stateDiagram-v2
    state "MojoPlusSubscription.status" as mp {
        [*] --> active : subscribeMojoPlus() publishes MojoPlusSubscribed
        active --> cancelled : cancelMojoPlus() publishes MojoPlusCancelled
        cancelled --> [*]
    }
    state "Dispute.status" as ds {
        [*] --> open : fileDispute() publishes DisputeFiled
        open --> upheld
        open --> dismissed
        upheld --> [*]
        dismissed --> [*]
    }
    state "LessonSubscription.status" as ls {
        [*] --> active
        active --> paused : pauseSubscription() (scaffold)
        active --> cancelled
    }
```

---

## 5. Booking a session (activity diagram)

The decision tree implemented by `makeBookSession`
(`libs/scheduling/src/application/book-session.use-case.ts`) using the pure
`conflict-detection.ts` functions:

```mermaid
flowchart TD
    A[bookSession input] --> B{tutor paused new bookings?}
    B -- yes --> X[throw SchedulingConflictError: paused]
    B -- no --> C{within minimum notice window?}
    C -- no --> Y[throw SchedulingConflictError: notice]
    C -- yes --> D[load existing booked/confirmed sessions]
    D --> E{hasConflict?}
    E -- yes --> Z[throw SchedulingConflictError: overlaps]
    E -- no --> F{respectsBuffer?}
    F -- no --> W[throw SchedulingConflictError: buffer]
    F -- yes --> G[save ScheduledSession status=booked]
    G --> H[append statusHistory {booked, now}]
    H --> I[publish SessionBooked]
    I --> J[return session]
```

---

## 6. Session booking (sequence diagram)

Shows the primary actors and the in-process event bus decoupling publisher from
subscriber modules.

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant A as apps/hub (composition root)
    participant UC as scheduling: bookSession
    participant R as SessionRepository (Prisma)
    participant B as EventBus
    participant N as notifications (subscriber)

    S->>A: choose a slot, submit booking
    A->>UC: bookSession({...})
    UC->>R: getSettings(tutorId)
    R-->>UC: SchedulingSettings
    UC->>UC: withinNoticeWindow? + hasConflict? + respectsBuffer?
    alt rejected
        UC-->>A: throw SchedulingConflictError(reason)
        A-->>S: show the rejection reason
    else accepted
        UC->>R: save(ScheduledSession booked)
        UC->>B: publish SessionBooked
        B->>N: dispatch handler (async)
        UC-->>A: return session
        A-->>S: booking confirmed
    end
```

---

## 7. Delivery confirmation → pricing / payments (sequence diagram)

`makeConfirmDelivery` turns a completion into financial events that `pricing` and
`payments` observe. Included infra is `PrismaBookingRepository`; the `pricing`
subscriber wiring is at the composition root (not shown as a class).

```mermaid
sequenceDiagram
    autonumber
    actor Stud as Student
    participant UC as booking: confirmDelivery
    participant R as BookingRepository (Prisma)
    participant B as EventBus
    participant PR as pricing (subscriber)
    participant PA as payments (subscriber)

    Stud->>UC: confirmDelivery({sessionId, confirmedBy, nowIso})
    UC->>R: findById(sessionId)
    R-->>UC: ScheduledSession (or null → SessionNotBookedError)
    UC->>R: markCompleted(sessionId, nowIso)
    UC->>R: saveConfirmation({confirmedBy, confirmedAt})
    UC->>UC: segmentCount = segmentsBetween(start,end) ceil/15
    UC->>B: publish SessionCompleted {segmentCount, rate}
    B->>PR: recordSessionCompletion(event) → CommissionSplit
    UC->>B: publish SessionDeliveryConfirmed
    B->>PA: (payout-release eligibility)
```

> `rate.amountMinor` is hard-coded to `session.isTrial ? 0 : 600_000` in
> `confirm-delivery.use-case.ts:44` (an Established default); the trial lesson is
> signalled by a zero rate. `pricing` reads the real per-segment rate via
> `TutorLevelReader` (`customRateMinor ?? DEFAULT_SEGMENT_RATE_NGN[level]`).

---

## 8. Payout release (sequence diagram)

`makeReleasePayout` publishes `PayoutRequested` before hitting the rail and
`PayoutCompleted` after.

```mermaid
sequenceDiagram
    autonumber
    actor T as Tutor
    participant UC as payments: releasePayout
    participant W as WalletRepository (Prisma)
    participant B as EventBus
    participant RA as PayoutRail (Paystack)
    participant N as notifications (subscriber)

    T->>UC: releasePayout({tutorId, amount, nowIso})
    UC->>W: getWallet(tutorId)
    W-->>UC: Wallet.balance (Money)
    alt balance < amount
        UC-->>T: throw InsufficientBalanceError
    else balance covers amount
        UC->>B: publish PayoutRequested
        UC->>RA: send(tutorId, amount) → externalRef
        RA-->>UC: { externalRef }
        UC->>B: publish PayoutCompleted {rail: externalRef}
    end
```

---

## 9. Identity: registration & authentication (sequence diagram)

`registerUser` validates policy, checks email uniqueness, hashes via the
`PasswordHasher` port, saves; `authenticateUser` verifies, rejects suspended
accounts, and issues a token via `TokenIssuer`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Prospect
    participant REG as identity: registerUser
    participant AUTH as identity: authenticateUser
    participant USR as UserRepository (Prisma)
    participant HSH as PasswordHasher (bcrypt)
    participant TOK as TokenIssuer (JWT)

    U->>REG: registerUser({email, password, role,...})
    REG->>REG: checkPasswordPolicy(password)
    alt policy invalid
        REG-->>U: throw WeakPasswordError(reasons)
    end
    REG->>USR: findByEmail(email)
    alt email exists
        REG-->>U: throw EmailAlreadyRegisteredError
    end
    REG->>HSH: hash(password)
    HSH-->>REG: passwordHash
    REG->>USR: save(User)
    REG-->>U: User

    U->>AUTH: authenticateUser({email, password})
    AUTH->>USR: findByEmail(email)
    AUTH->>HSH: verify(password, hash)
    alt suspended
        AUTH-->>U: throw AccountSuspendedError
    end
    AUTH->>TOK: issue(userId)
    TOK-->>AUTH: {token, expiresAt}
    AUTH-->>U: {token, expiresAt, role}
```

---

## 10. Lab access (sequence diagram)

`apps/hub/app/(tutor)/lab/[sessionId]/page.tsx` mints a short-lived LiveKit token
server-side per load; `LabRoom` consumes it client-side.

```mermaid
sequenceDiagram
    autonumber
    participant P as hub Lab page (server)
    participant PR as LiveKitLabProvider
    participant LK as LiveKit cloud
    participant CR as LabRoom (client)

    P->>PR: new LiveKitLabProvider(env keys)
    P->>PR: createAccess({sessionId, participantId, participantName})
    PR->>LK: AccessToken → JWT (room=mojo-session-<id>, ttl 3h)
    LK-->>PR: participantToken
    PR-->>P: LabAccess {roomName, serverUrl, token, expiresAt}
    P-->>CR: <LabRoom access={access}/>
    CR->>LK: connect (video+audio+screen)
```

---

## 11. Event catalog (as defined in code)

The 12 events **that actually exist** in `libs/shared/events/src/events.types.ts`,
with the module that publishes each in the current code, and the subscribers the
planning docs assign. Wiring of subscribers happens at the composition root, so
"subscribers" below are from `assets/mojo-modules.md` unless gated in code.

| Event | Published by (in code) | Payload (from code) |
|---|---|---|
| `SessionBooked` | scheduling `bookSession` | `{ sessionId, tutorId, studentId, isTrial }` |
| `SessionCancelled` | scheduling `cancelSession` | `{ sessionId, cancelledBy, withinNoticeWindow }` |
| `SessionCompleted` | booking `confirmDelivery` | `{ sessionId, tutorId, studentId, segmentCount, rate: Money }` |
| `SessionNoShow` | *(not published in code)* | `{ sessionId, noShowBy }` |
| `SessionDeliveryConfirmed` | booking `confirmDelivery` | `{ sessionId, confirmedBy }` |
| `TutorLevelChanged` | tutor-performance `recomputeLevel` | `{ tutorId, fromLevel, toLevel }` |
| `MojoPlusSubscribed` | mojo-plus `subscribeMojoPlus` | `{ tutorId }` |
| `MojoPlusCancelled` | mojo-plus `cancelMojoPlus` | `{ tutorId }` |
| `PayoutRequested` | payments `releasePayout` | `{ tutorId, amount: Money }` |
| `PayoutCompleted` | payments `releasePayout` | `{ tutorId, amount: Money, rail }` |
| `ReviewSubmitted` | reviews `submitReview` | `{ sessionId, tutorId, rating }` |
| `DisputeFiled` | trust-safety `fileDispute` | `{ sessionId, filedBy, reason }` |
| `DisputeResolved` | *(not published in code)* | `{ disputeId, outcome }` |

### Events the planning docs list but the code catalog does NOT define

```mermaid
flowchart LR
    subgraph PLANNED["Roadmap event, absent from events.types.ts"]
        A[TutorApplicationSubmitted / Approved / Rejected]
        B[SessionRescheduled]
        C[ReferralConverted]
    end
    A -.->|referenced in tutor-profile TODO| TP[tutor-profile/src/application]
    C -.->|referenced in referrals TODO| RF[referrals/src/application]
```

These are called out in code as TODOs (e.g. `referrals`' `track-referral.use-case.ts`
says "TODO: publish `ReferralConverted` once it's added to @mojo/shared/events"). The
catalog in the README (`@mojo/shared/events` "doesn't yet cover every event the
scaffold modules' TODO comments reference") confirms this.

> **[divergence]** The `assets/mojo-modules.md` event table lists
> `TutorApplicationSubmitted/Approved/Rejected`, `SessionRescheduled`,
> `ReferralConverted`, and `DisputeResolved` as part of the plan. Of these, only
> `DisputeResolved` is typed in `events.types.ts` (though nothing publishes it yet);
> the others are absent from the catalog entirely.
