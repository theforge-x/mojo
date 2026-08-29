# Mojo — the core flow end to end

The journey that makes Mojo what it is: sign in, find a tutor, book, meet in
the lab, and get paid when the lesson is delivered. The same path drives the
demo (`USE_PRISMA=false`) and the Prisma-backed deployment — only the
repositories change.

## 1. Authenticate

`/login` renders `LoginForm` (`@mojo/identity/feature`). Submitting calls the
server action `loginWithDemo` (`apps/hub/lib/actions.ts`), which runs
`makeAuthenticateUser` through the hub's composition root and stores two
httpOnly cookies:

| Cookie | Value | Used by |
|---|---|---|
| `mojo_user` | opaque session token | `currentUser()` resolves it back to a user via `identity.userByToken` |
| `mojo_role` | `tutor` / `student` (admin on the admin app) | route-level gate `apps/hub/proxy.ts` + role-aware UIs |

Role routing: `/` redirects tutors to `/tutor/home` and everyone else to
`/student/home`. Demo accounts (password `Password123`): `tutor@mojo.dev`,
`student@mojo.dev`.

## 2. Find a tutor

A student on `/student/home` clicks **Find a tutor** → `/student/tutors`.
That page runs `makeSearchTutors` against the discovery index (`InMemoryTutorSearchIndex`
in the demo; `PrismaTutorSearchIndex` in prod) via `hub.discovery.search(filters)`.

## 3. Book a session

`/student/tutors/[tutorId]` renders the tutor's bookable slots (slots derived
from availability rules + booked sessions). **Book** posts to
`POST /api/sessions`, which runs `makeBookSession`:

- validates against `minimumNoticeMinutes` and slot conflicts
- creates the session with status **booked** and a timestamped `statusHistory`
- publishes `SessionBooked` (the hub fires a confirmation email/listener)

## 4. Start and join the lab

The tutor owns the start:

- **Tutor**: on `/tutor/home` a booked session shows **Start live lab** →
  `POST /api/sessions/[id]/start` → `makeConfirmSession` moves the session
  **booked → confirmed** (timestamped into `statusHistory`), then the tutor is
  routed into `/tutor/lab/[sessionId]`.
- **Open lab** appears for confirmed sessions. The tutor lab page
  (`apps/hub/app/tutor/lab/[sessionId]`) mints a per-request LiveKit access
  token scoped to the tutor participant.
- **Student**: once the session is **confirmed**, `/student/home` shows
  **Join lab** → `/student/lab/[sessionId]` mints a scoped token for the
  student. Both participants land in the same LiveKit room keyed by session id
  (`@mojo/lab`) — live audio/video, realtime chat, a shared whiteboard, and
  file sharing (Supabase Storage, or in-browser in the demo).

Both lab pages verify the participant is the tutor/student of record and
redirect to `/login` otherwise.

## 5. Charge on session completion

After the lesson, the student confirms delivery:

- `/student/home` → **Confirm delivery** → `POST /api/sessions/[id]/confirm`
  → `makeConfirmDelivery` (`@mojo/booking`):
  1. marks the session **completed** and saves the delivery confirmation
  2. publishes `SessionCompleted` (segment count derived from the session's
     duration) and `SessionDeliveryConfirmed`

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
   └────────── cancelled ──────────┘
```

Every transition appends to `statusHistory` with a timestamp, so analytics,
cancellation-rate ranking, and response-time metrics all read from one
trustworthy stream.