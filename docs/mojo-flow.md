# Mojo — the core flow end to end

The journey that makes Mojo what it is: sign in, find a tutor, book (student
charged at booking), meet in the lab, confirm delivery (tutor credited), and
withdraw the payout. The same path drives the demo (`USE_PRISMA=false`) and
the Prisma-backed deployment — only the repositories change.

## 1. Authenticate

`/login` renders `LoginForm` (`@mojo/identity/feature`). Submitting calls the
server action `loginWithDemo` (`apps/hub/lib/actions.ts`), which runs
`makeAuthenticateUser` through the hub's composition root and stores two
httpOnly cookies:

| Cookie | Value | Used by |
|---|---|---|
| `mojo_user` | opaque session token | `currentUser()` resolves it back to a user via `identity.userByToken` |
| `mojo_role` | `tutor` / `student` (admin on the admin app) | route-level gate `apps/hub/proxy.ts` + role-aware UIs |

Role routing: `/` is the landing page for guests and the student home for
students; it redirects tutors to `/tutor` and everyone else to `/`. Student
routes live at the root (`/tutors`, `/lab/[sessionId]`); tutor routes are
under `/tutor`. Demo accounts (password `Password123`): `tutor@mojo.dev`,
`student@mojo.dev`.

## 2. Find a tutor

A student on `/` clicks **Find a tutor** → `/tutors`.
That page runs `makeSearchTutors` against the discovery index (`InMemoryTutorSearchIndex`
in the demo; `PrismaTutorSearchIndex` in prod) via `hub.discovery.search(filters)`.
All five filters — subject, level, language, `minRating`, `availableWithinHours`
(2/24/48/72h shortcuts, 1–168h accepted) — are implemented in both indexes and
exposed in `tutor-filter-bar.tsx`. Tutor cards show photo, level, price/segment,
response time, and rating. Intro-video thumbnails are still missing (video URLs
live only on `TutorApplication`, not on `TutorProfile`/`TutorSearchResult`).

Pre-booking chat is wired: **Message tutor** on `/tutors/[tutorId]` opens
`/messages?with=<tutorId>` (`MessageChat` composer, `POST /api/messages`).

## 3. Book a session (charged at booking)

`/tutors/[tutorId]` renders the tutor's bookable slots (slots derived
from availability rules + booked sessions) with the trial banner
(`First lesson trial — 50% off`) when the student has no non-refunded trial
charge for that tutor. **Book** posts to
`POST /api/sessions`, which runs `makeBookSession` then `billing.charge`:

- validates against `minimumNoticeMinutes` and slot conflicts
- creates the session with status **booked** and a timestamped `statusHistory`
- captures the student charge immediately via `makeChargeStudent`
  (segments × tutor rate, `TRIAL_PRICE_PERCENT = 50` when `isTrial`;
  `TrialAlreadyUsedError`/`DuplicateChargeError` guarded; `provisionDemoMethod`
  stubs a card in demo mode) — charge failure rolls the booking back via
  `scheduling.cancel`
- publishes `SessionBooked` (the hub fires a confirmation email/listener)

Receipts live at `/payments` (`GET /api/charges`): segment breakdown, trial
discount, refund state, and `Refund` for cancelled sessions
(`POST /api/charges/[id]/refund`, cancelled-only). Cancelling
(`POST /api/sessions/[id]/cancel`) auto-refunds via
`billing.refundForSession(..., 'cancelled')`. Reschedule is a thin
`POST /api/sessions/[id]/reschedule` (re-books then cancels the old session;
student `booked` sessions only, no charge move yet, no domain use-case or
`SessionRescheduled` event). The free-replacement guarantee is not built.

## 4. Start and join the lab

The tutor owns the start:

- **Tutor**: on `/tutor` a booked session shows **Start live lab** →
  `POST /api/sessions/[id]/start` → `makeConfirmSession` moves the session
  **booked → confirmed** (timestamped into `statusHistory`), then the tutor is
  routed into `/tutor/lab/[sessionId]`.
- **Open lab** appears for confirmed sessions. The tutor lab page
  (`apps/hub/app/tutor/lab/[sessionId]`) mints a per-request LiveKit access
  token scoped to the tutor participant.
- **Student**: once the session is **confirmed**, `/` shows
  **Join lab** → `/lab/[sessionId]` mints a scoped token for the
  student. Both participants land in the same LiveKit room keyed by session id
  (`@mojo/lab`) — live audio/video, realtime chat, a shared whiteboard, and
  file sharing (Supabase Storage, or in-browser in the demo).

Both lab pages verify the participant is the tutor/student of record and
redirect to `/tutor` (tutor) or `/` (student/guest) otherwise. The UI is
guarded in-app with `currentUser()` from `apps/hub/lib/session.ts`.

## 5. Confirm delivery → wallet credit (charge already captured)

After the lesson, the student confirms delivery (`/` → **Confirm delivery** →
`POST /api/sessions/[id]/confirm` → `makeConfirmDelivery` (`@mojo/booking`)):

1. marks the session **completed** and saves the delivery confirmation
2. publishes `SessionCompleted` (segment count derived from the session's
   duration) and `SessionDeliveryConfirmed`

Reviews unlock here (`POST /api/reviews`, one per `completed` session, rendered
on the tutor profile), and the recap is generated + rendered on both homes via
`RecapCard`. No tutor-side complete and no auto-confirm worker exist yet —
completion is student-confirm only.

The hub's event subscribers react to `SessionCompleted` (see
`apps/hub/demo/composition-root.ts`):

1. `makeRecordSessionCompletion` (`@mojo/pricing`) computes the commission
   split from the tutor's level, Mojo+ status, and segment price —
   trials resolve to a trial charge.
2. The tutor's wallet (`@mojo/payments`) is **credited** with the take-home
   amount.
3. The tutor's performance (`@mojo/tutor-performance`) recomputes hours taught
   and re-evaluates the tutor's level.
4. An AI recap (`@mojo/ai-learning`) is generated.

`SessionDeliveryConfirmed` marks the payout as eligible to release — the tutor
withdraws via **Request payout** (`POST /api/payouts` →
`makeReleasePayout`), which in production pushes through the Paystack rail.

## Status timeline

```
booked → confirmed (tutor starts lab) → completed (student confirms delivery)
   ├── cancelled (auto-refunds the student charge) ──┤
   └── no_show (via POST /api/sessions/[id]/no-show) ┘
```

Every transition appends to `statusHistory` with a timestamp, so analytics,
cancellation-rate ranking, and response-time metrics all read from one
trustworthy stream.