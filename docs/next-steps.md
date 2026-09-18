# Mojo — Phase 1 MVP: what's left and how to finish it

Status snapshot taken against `dev` @ `a08eca7` (2026-09-16). Legend used through
this doc and the roadmap / roles-features checklists:

| Mark | Meaning |
|---|---|
| `[x]` | Built and wired in the current codebase |
| `[~]` | Partially built — exists but incomplete or unwired |
| `[ ]` | Missing |

The Phase 1 goal, restated from the roadmap: **a tutor can be found, booked for a
trial, and paid for a completed lesson, end to end.** Everything below is scoped to
that loop.

---

## Where each Phase 1 mechanic stands

| Mechanic | Built | What exists | What's missing |
|---|---|---|---|
| Tutor profile & application | `[x]` | 8-step wizard (`apply-form.tsx`) — displayName, photo (5MB validated), education, timezone, availability, subjects, languages, bio, certs, intro video; submission stored via `tutor-profile/submit-application`; review → live hand-off wired (admin queue reads the hub over `HUB_URL`, approval publishes a searchable profile); applicant status view (`/apply`) | Rejected → resubmit dead-end (no edit form, no reason surfaced); `in_review` unreachable; no download/edit of an already-approved profile; admin card hides languages/certs/video |
| Tutor search & discovery | `[x]` | `TutorSearchFilters` (subject, level, language, minRating, availableWithinHours) implemented in **both** `InMemoryTutorSearchIndex` and `PrismaTutorSearchIndex`; `/tutors` filter bar exposes all five; cards show photo, level, rating, price/segment, response time | No intro-video thumbnail on cards/detail (`introVideoUrl` lives only on `TutorApplication`, dropped in `profileFromApplication`); no sort/pagination |
| Trial lesson + booking | `[x]` | `isTrial` bookings against live availability (min-notice + conflict validation); booked→confirmed→completed with timestamped `statusHistory`; **charge at booking** via `billing.charge` (segments × rate, 50% trial off, one-trial-per-tutor guard, rollback on failure); trial banner + totals in `BookButton`; domain `reschedule-session` use-case (in-place move, same id → exactly one charge, booked + confirmed, tutor-side `RescheduleForm`); `SessionRescheduled` event; cancel with UI + auto-refund; **free-replacement entitlement** (`ReplacementGrant`: cancelled trial banks one free rebook, single-use, chain terminates; redeem at checkout for ₦0); `GET /api/quote` breakdown used by checkout; availability-aware reschedule picker | Calendar export is client-side ICS/Google links; Mojo+ UI done (see Step 4) |
| Virtual lab | `[x]` | LiveKit per-request participant tokens, room per session; video + whiteboard + text chat + file sharing (in-browser in demo); both-role join guards | (none for MVP scope — deep-link status gate and 3h token refresh are polish) |
| Payments — Nigeria-first | `[x]` | 15-min segments as the pricing atom; level-fixed segment rates; `StudentCharge`/`ChargeRefund` ledger (demo + Prisma); charge at booking, auto-refund on cancel, student-initiated refund for cancelled sessions; `/payments` receipts with segment/trial/refund breakdown; internal wallet ledger; payout request + release via `/api/payouts` | Stub rail only (no real Paystack/Flutterwave collect); Mojo+ subscribe / custom pricing use-cases exist but are unwired (no UI/API); no payout threshold / history view |
| Messaging | `[x]` | Hub facade `messaging.send/threadBetween/threadsFor/markRead`; `POST/GET /api/messages` + `POST /api/messages/read`; `/messages` thread list + `MessageChat` composer (4s poll, read receipts); pre-booking gating (student→real tutor, tutor→interest/session); entry via **Message tutor** button | No attachments, no moderation/report UI, no search |
| Reviews | `[x]` | `POST /api/reviews` gated to student-of-record + `completed` + one-per-session; `ReviewForm` on student home; review list (first 10) on tutor profile; aggregate rating on cards | No edit/delete, no tutor reply, no flag/moderation UI |
| Notifications | `[x]` | Event-driven dispatchers (email + whatsapp, in-memory by default, `RESEND_API_KEY` switches a real email channel); subscribers on book/complete/cancel/submit events; per-channel prefs (`GET/PUT /api/notifications/preferences`, `/settings`); cron/worker (`POST /api/workers/reminders` sweeps all students with per-user isolation + sent journal, `vercel.json` schedules, `CRON_SECRET` auth; manual fire retained); calendar export (ICS download + Google link on every upcoming session card) | Done |

## Phase 0 leftovers that block Phase 1

The calendar foundation is complete — recurring rules, one-off exceptions,
inter-session buffer, minimum notice, pause-new-bookings, and conflict
detection are built and validated at book time. What remains is operational:
- **Reminder scheduling** — `dueSessionReminders` (day-before + T-30) + prefs +
  `POST /api/notifications/reminders` exist, but nothing fires on a time basis
  (no cron/worker; manual "Check reminders" only).

## The application → live loop (was the biggest blocker; now wired)

The review → publish hand-off is in place (`tutor-profile/review-application`
upserts a `TutorProfile` on approval) and is wired through both apps:

- The hub's submitted applications live in the hub's `state.applications`; the
  admin app reads them over the `HUB_URL` bridge (in-memory `fetch` in demo
  mode, direct Prisma when `USE_PRISMA=true`) and posts review decisions back,
  so an approval lands on the same application and publishes a live profile.
- `InMemoryTutorSearchIndex` reads straight off `state.profiles` — a saved
  profile appears in search at the default Entry rate.
- The wizard now captures real profile fields (displayName, photo with 5MB
  validation, education, timezone, availability persisted to scheduling in the
  same request) and `/apply` shows pending / approved / rejected + submittedAt.

Still open: rejected → resubmit is a dead-end (copy promises edit-and-resubmit
but the status card short-circuits with no form and no reason surfaced);
`in_review` is unreachable (`review-application` only allows
`pending → approved|rejected`); no download/edit of an already-approved profile;
admin cards hide languages/certs/intro video so reviewers can't assess them.
`profileFromApplication` still drops `introVideoUrl` (lives only on
`TutorApplication`).

---

## The plan — ordered steps to complete Phase 1

### Step 1 — Application → live polish (core loop done, edges remain) ✅ mostly done
The MVP is real — a non-seeded tutor can apply, get approved, and be booked.
Capture (displayName, photo, education, timezone, availability), hub-backed
review, and `/apply` status are all wired. Left: rejected → resubmit form +
reason, `in_review` or remove it, edit-approved-profile (triggers re-review),
and surfacing languages/certs/video in the admin queue.
- Acceptance (passes today): fresh tutor applies → admin approves → tutor
  appears in `/tutors` at Entry with photo/bio.

### Step 2 — Discovery filters ✅ done except video thumbnail
All five filters work in both indexes and the `/tutors` filter bar; each filter
provably changes results against seeded data. Left: carry `introVideoUrl`
(`TutorApplication` → `TutorProfile` → `TutorSearchResult` → both indexes) and
render thumbnails on cards + detail. Sort/pagination are deliberate deferrals.

### Step 3 — Trial, reschedule, and the free-replacement guarantee ✅ done
Trial charge at booking (50% off, banner + totals, one-per-tutor guard) and the
domain `reschedule-session` use-case (same engine validation, `SessionRescheduled`
event, booked + confirmed, student + tutor `RescheduleForm`) exist. The move is
in place (same id), so the original charge settles it — exactly one charge per
session, verified live. The **free replacement lesson** is a `ReplacementGrant`
in payments: cancelling a trial banks one free rebook with the same tutor,
redeemed at checkout for ₦0; single-use enforced in `charge-student`, and a
redeemed session can never mint a follow-up. Checkout reads a `GET /api/quote`
breakdown (preferred by `BookButton` for trials, where custom Mojo+ rates make
local math wrong), and the reschedule picker shows the tutor's weekly windows
plus the notice floor (`GET /api/availability/windows`) before the engine
re-validates.
3. Acceptance (verified live): student books trial → reschedules (same id, one
   charge) → cancels (refund + grant) → rebooks free (₦0) → grant reuse rejected
   → cancelling the redemption grants nothing.

### Step 4 — Student-side money (collect wired, Mojo+ remains) ✅/◐
Charge at booking (`provisionDemoMethod` stub in demo), `/payments` receipts
with segment/trial/refund breakdown, auto-refund on cancel, cancelled-only
student refund, and tutor payout math (segments × take-home on completion,
trial ₦0) all work. Real collect is wired: saved-card charges go through the
Paystack charge-authorization rail before any row is written; cardless checkout
redirects (`POST /api/payments/initialize` → Paystack → `/payments/verify`),
with pending/failed charge states, idempotent capture, saved authorizations
for one-click rebook, and an HMAC-verified `POST /api/payments/webhook`.
Live-verified against Paystack test mode (initialize + verify round-trip).
Mojo+ subscribe/cancel + custom per-segment pricing are surfaced
(`GET/POST /api/mojo-plus`, tutor dashboard card, bounded rates) with a
payout-history view from the wallet ledger. Demo mode keeps the stub ledger
with zero behavior change. Left:
1. Point the Paystack dashboard webhook at the deployed hub URL.
2. Acceptance: booking produces a predictable student charge and the tutor
   payout math still matches.

### Step 5 — Reviews end to end ✅ done (minimal)
`submit-review` is wired through `POST /api/reviews` (student-of-record +
`completed` + one-per-session) with `ReviewForm` UI, and the tutor profile
shows the review list (first 10) feeding the card aggregate.
Acceptance passes: only the student of a completed session can review once; the
new rating moves the card. Left (polish, not MVP-blocking): edit/delete, tutor
reply, flag/moderation UI.

### Step 6 — Pre-booking messaging end to end ✅ done
`send-message` is exposed on the hub facade with `POST /api/messages` (+ read
route) and the `/messages` thread derivation + `MessageChat` composer, gated to
authenticated users (tutor/student, lab chat stays separate).
Acceptance passes: two demo accounts hold a pre-booking conversation visible in
both inboxes. Left: attachments, moderation/report, search.

### Step 7 — Notifications + calendar sync ✅ done
Event dispatch (book/complete/cancel/submit), per-channel prefs
(`GET/PUT /api/notifications/preferences`, `/settings`), and
`dueSessionReminders` (day-before + T-30) with manual fire
(`POST /api/notifications/reminders`) are done; scheduling exceptions/buffers
already block slots in view and at book time. The worker sweep
(`POST /api/workers/reminders`, per-student isolation, sent journal, `CRON_SECRET`
auth, `vercel.json` schedule) fires reminders on time. Calendar sync is
client-side (ICS download + prefilled Google link on session cards) — no OAuth needed.

### Step 8 — Tutor teaching actions + recap surfaced ✅ done
Tutor cancel / no-show / start + student confirm + `RecapCard` on both homes
(generated on `SessionCompleted` via `makeGenerateRecap`) are wired, plus:
1. Tutor-side complete (`POST /api/sessions/[id]/complete`, tutor dashboard
   button) and the auto-confirm worker (`POST /api/workers/auto-confirm`,
   `vercel.json` hourly) — a silent student no longer stalls payout + recap.
   Double completion is rejected by the booking domain (no double-pay).
   Student-side no-show button added to student session cards.
2. Hub-side dispute filing (`POST /api/disputes` + `DisputeButton` on both
   homes' finished/cancelled cards, open-dispute status visible, one open
   dispute per session; resolution stays in admin `/trust/disputes`).
3. Acceptance: both sides can close a session; the recap is readable in the UI;
   a disputed/cancelled session settles through a visible refund path.

---

## MVP-complete check — run this list before calling Phase 1 done

- [x] A brand-new tutor can complete the full application, get approved by admin,
      and appear in search at the Entry rate with a real profile.
      (Edges left: rejected-resubmit, edit-approved-profile.)
- [x] Discovery filters (subject, level, language, rating, availability) actually
      filter in the demo and in the Prisma search index.
      (Left: intro-video thumbnails.)
- [x] A student can find → message → book a paid trial against live availability,
      with the discount visible at checkout.
      (Charge-at-booking + trial banner/totals + `/payments` receipts done;
      quote endpoint + real rail remain.)
- [x] Both participants can join the in-platform lab; the session status timeline
      stays truthful (booked → confirmed → completed/cancelled/no_show).
- [x] On booking: segments × rate charges the student's recorded payment method;
      on completion: the wallet credits the tutor's take-home, and the recap is
      generated + visible.
      (Completion is student-confirm only — no tutor complete / auto-confirm yet.)
- [x] The free-replacement entitlement and reschedule/cancel policy hold for trials.
       (Cancel + auto-refund; reschedule moves in place with exactly one charge;
       cancelled trials bank one single-use free rebook that settles at ₦0.)
- [x] Reviews unlock only after a completed lesson and surface on the tutor profile.
- [x] Notifications cover the whole loop, including time-based reminders.
       (Events + prefs + cron/worker sweep + calendar export.)
- [~] No demos-only seat left — every flow works against the Prisma repositories too.
       (`StudentCharge`/`ChargeRefund`, search, sessions, messaging, reviews,
       replacement grants, disputes, reschedule clock moves all have Prisma repos;
       Mojo+ UI remains unwired.)
- [x] Hub dispute filing is wired (file from session cards, status visible to the
       student; resolution in admin).

## Demo caveats to keep in mind while closing these

- Route handlers and page renders run in separate module instances in the dev
  server, so accounts created via an API route may not resolve on later page renders
  (`userByToken`). That's a pre-existing in-memory-demo constraint, documented in
  `apps/hub/demo/composition-root.ts`; it does not affect the Prisma path.
- API routes that set cookies after bcrypt-heavy work must NOT import
  `next/headers` `cookies()` (dev-serve empty-500s); use `NextRequest.request.cookies`
  + `userByToken`, as the applications route does.
- The admin app and hub app each own an in-memory store in the demo; Steps 1 and 2
  above are the places that split has to be bridged (shared `DemoState`).
  
## Suggestions (Manual work)
Three deploy-time items before you call it launched (not code work):
1. Prod DB: prisma migrate deploy — the group_labs migration has only applied to dev so far.
2. Prod env: USE_PRISMA, DATABASE_URL, live Paystack secret, LiveKit prod creds, plus the cron hits for auto-confirm/reminders workers.
3. Known untested-at-scale: the 11+ seat discount leg is covered by unit tests + the live quote endpoint (E2E ran with 2 seats); LiveKit room joins can't be exercised until prod creds exist — same standing as 1-on-1 rooms.
