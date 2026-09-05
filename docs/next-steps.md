# Mojo — Phase 1 MVP: what's left and how to finish it

Status snapshot taken against `dev` @ `119d303` (2026-08-29). Legend used through
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
| Tutor profile & application | `[~]` | 6-step wizard (`apply-form.tsx`) — subjects, bio, experience/certs, intro video, account; submission stored via `tutor-profile/submit-application` | Photo, education, timezone, and availability capture in the wizard; applicant status view; the review → live hand-off (below) |
| Tutor search & discovery | `[~]` | `TutorSearchFilters` domain (subject, level, language, minRating, availableWithinHours); `/tutors` page + cards (photo, level, rating, price/segment, response time) | **The demo index ignores every filter** — `InMemoryTutorSearchIndex.search` returns all profiles. UI exposes only subject + level. No filters on language / rating / availability window. No intro-video thumbnail on cards |
| Trial lesson + booking | `[~]` | `isTrial` bookings against live availability (min-notice + conflict validation); booked→confirmed→completed with timestamped `statusHistory`; trial charge (tutor keeps ₦0); segment pricing + commission split on completion; cancel with UI | Reschedule (no use-case, no route, no UI); free replacement lesson guarantee; student-side checkout / payment capture |
| Virtual lab | `[x]` | LiveKit per-request participant tokens, room per session; video + whiteboard + text chat + file sharing (in-browser in demo); both-role join guards | (none for MVP scope) |
| Payments — Nigeria-first | `[~]` | 15-min segments as the pricing atom; level-fixed segment rates; internal wallet ledger; wallet credit on `SessionCompleted`; payout request + release via `/api/payouts` | **Nothing collects money from students** — no payment method, no charge at booking, no receipts, no refund path. Mojo+ subscribe / custom pricing use-cases exist but are unwired. No payout threshold / history view |
| Messaging | `[ ]` | `send-message` use-case in the lib; `/messages` shows threads derived from sessions | No hub facade method, no API, no composer — pre-booking chat is not functional |
| Reviews | `[ ]` | `submit-review` use-case in the lib; seeded reviews feed aggregate ratings on tutor cards | No submit UI, no unlock-after-complete rule, no per-review list on a tutor's profile |
| Notifications | `[~]` | Event-driven dispatchers (email + whatsapp, in-memory by default, `RESEND_API_KEY` switches a real email channel); subscribers on book/complete/cancel/submit events | Scheduled reminders (calendar-based), calendar sync, per-channel preferences |

## Phase 0 leftovers that block Phase 1

The calendar engine is the load-bearing foundation; three Phase 0 items remain:
- **Availability exceptions** — the repo (`getExceptions`) exists but there is no
  set-exception use-case or UI. Tutors can only set recurring weekly rules.
- **Buffer time** — settings carry minimum booking notice only; inter-session
  buffer isn't modeled.
- **Reminder scheduling** — notification dispatch is purely event-driven; nothing
  fires on a time basis.

## The single biggest blocker: the application → live loop

The review → publish hand-off exists as a use-case (`tutor-profile/review-application`,
which upserts a `TutorProfile` on approval) but it is **not wired into either app**:

- The hub's submitted applications live in the hub's in-memory `state.applications`.
  The admin app's review queue operates on the **admin app's own in-memory store**,
  so an admin approval never sees the hub's application and never publishes a profile.
- The hub facade exposes no `review` method and no application-status read.
- Approval *would* work end-to-end in the demo if wired, because
  `InMemoryTutorSearchIndex` reads straight off `state.profiles` — a saved profile
  appears in search at the default Entry rate. The main store split is the only thing
  standing between "submitted application" and "findable tutor".

Secondary, related gap: `profileFromApplication` publishes a placeholder
(`displayName` derived from subjects, empty `photoUrl`), so the wizard should capture
display name + photo for the profile that lands on the live listing.

---

## The plan — ordered steps to complete Phase 1

### Step 1 — Close the application → live loop (do this first)
The MVP is not real until a non-seeded tutor can be found and booked.
1. Extend the application (`tutor-profile` domain + wizard) so the approval can
   publish a decent profile: capture display name, photo (with fallback avatar),
   education, timezone, and the applicant's availability & timezone through the
   scheduling engine in the same submission.
2. Wire `makeReviewApplication` into the hub facade (`profile.review`) and give the
   admin app's review route a hub-backed store, so an approve/reject decision lands
   on the same application the hub submitted (single shared `DemoState` for the
   demo; real repository wiring in the Prisma path).
3. Add an applicant-facing status read — `/apply` or `/tutor` shows pending /
   approved-with-link-to-profile / rejected-with-reason.
4. Acceptance: submit an application as a fresh student-signup tutor → approve it
   from the admin queue → the tutor appears in `/tutors` at the Entry rate with
   their photo and bio, and their `/tutor` surface recognises an approved profile.

### Step 2 — Make discovery actually filter (nobody can find a tutor otherwise)
1. Implement the filters in `InMemoryTutorSearchIndex` (subject, level, language,
   minRating, availableWithinHours) — today it ignores them.
2. Expose language, min-rating, and availability-window controls on `/tutors`, plus
   the intro-video thumbnail on tutor cards.
3. Acceptance: each filter provably changes results against the seeded data; a tutor
   with no availability in the chosen window drops out.

### Step 3 — Trial, reschedule, and the free-replacement guarantee
1. Add `reschedule-session` in `scheduling` (re-validates availability + policy
   through the same engine), with routes + UI for both roles.
2. Model the **free replacement lesson** as a booking-level entitlement on trial
   sessions: a failed-fit trial entitles the student to one replacement lesson that
   doesn't consume payment; enforce it in the pricing/completion path.
3. Make the **trial discount explicit at checkout** (displayed segment price vs.
   trial price) so the mechanic is visible before the student commits.
4. Acceptance: student books trial → tutor runs it in the lab → student confirms →
   tutor's wallet credits correctly; a rescheduled session re-conflicts; a
   replacement tray cancelled trial is honoured once.

### Step 4 — Student-side money (bill the student, not just the tutor)
1. Capture a payment method at booking (demo: stub ledger entries; prod: Paystack /
   Flutterwave intent), compute the expected charge up front (segments × rate, trial
   discount applied), and record a charge against the student.
2. Perspective them in a student payments view — receipts, segment breakdowns, and
   a refund/credit path (used by the free-replacement and dispute flows).
3. Surface Mojo+ subscribe + custom per-segment pricing for tutors (use-cases exist
   in `mojo-plus` and `pricing`; they just aren't wired), plus a payout history view.
4. Acceptance: booking a session produces a predictable student charge and the tutor
   payout math still matches (segments × take-home on completion).

### Step 5 — Reviews end to end
1. Wire `submit-review` through a UI + `POST /api/reviews` on a completed session,
   gated by the student-of-record and completion status.
2. Show the review list on the tutor's profile (and per-review unlock flows through
   the existing aggregate rating so cards stay consistent).
3. Acceptance: only the student of a completed session can review once; the tutor's
   new rating moves their card aggregate.

### Step 6 — Pre-booking messaging end to end
1. Expose `send-message` on the hub facade, add `POST /api/messages`, and build the
   composer + conversation page off the existing `/messages` thread derivation.
2. Gate to authenticated users (tutor and student). Keep lab realtime chat separate.
3. Acceptance: two demo accounts hold a pre-booking conversation and the start
   session shows in both inboxes.

### Step 7 — Calendar + notification polish needed by the loop
1. Availability exceptions: add a set-exception use-case + UI on the weekly calendar,
   and let booking validate against exceptions.
2. Buffer minutes between sessions, as a scheduling setting.
3. Time-based reminder scheduling in `notifications` (e.g. session T-minus 30min and
   day-before), plus very basic per-channel preferences.
4. Acceptance: an exception blocks a slot in view and at book time; a reminder fires
   before a booked trial; a tutor's availability shows buffer around booked slots.

### Step 8 — Tutor teaching actions + recap surfaced
1. Tutor-side mark-complete / no-show / cancel from the lab; today completion is
   student-confirm only and there's no no-show state anywhere.
2. Display the generated post-lesson recap on the student and tutor session views —
   the recap is produced on `SessionCompleted` but nothing renders it.
3. Acceptance: both sides can close a session; the recap the AI generated on the
   completion event is readable in the UI.

---

## MVP-complete check — run this list before calling Phase 1 done

- [ ] A brand-new tutor can complete the full application, get approved by admin,
      and appear in search at the Entry rate with a real profile.
- [ ] Discovery filters (subject, level, language, rating, availability) actually
      filter in the demo and in the Prisma search index.
- [ ] A student can find → message → book a paid trial against live availability,
      with the discount visible at checkout.
- [ ] Both participants can join the in-platform lab; the session status timeline
      stays truthful (booked → confirmed → completed/cancelled).
- [ ] On completion: segments × rate charges the student's recorded payment method,
      the wallet credits the tutor's take-home, and the recap is generated + visible.
- [ ] The free-replacement entitlement and reschedule/cancel policy hold for trials.
- [ ] Reviews unlock only after a completed lesson and surface on the tutor profile.
- [ ] Notifications cover the whole loop, including time-based reminders.
- [ ] No demos-only seat left — every flow works against the Prisma repositories too
      (each use-case above already goes through both repository sets).

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