# Mojo — Feature List by Role

A companion to the phased roadmap, organized by who uses each feature instead of when
it ships. Written as checklists — pull items into whichever phase they belong to as
you build.

Status as of 2026-08-29 (`dev` @ `119d303`): `[x]` built & wired · `[~]` partial
(exists but incomplete or unwired) · `[ ]` not started. The completion plan for the
Phase 1 loop is `docs/phase1-mvp-todo.md`.

---

## Shared across all roles

**Account & access**
- [x] Sign up / log in (email + password via `@mojo/identity`; **no** OAuth yet)
- [ ] Password reset / account recovery
- [~] Profile photo, display name, timezone, locale settings — display name at signup
      and a photo fallback exist; timezone & locale are not modeled
- [ ] Notification channel preferences (email vs. WhatsApp, per notification type)
- [ ] Help center / support contact access
- [ ] Delete account / export personal data

---

## Admin

**Tutor & content oversight**
- [~] Tutor application review queue (approve / reject — review route exists but
      operates on the admin app's own in-memory store, so approval never publishes a
      live profile yet; request-changes not present)
- [ ] Re-review queue for tutors who edit an already-approved profile
- [ ] Profile content moderation — photos, intro videos, written bios
- [ ] Review flagging for public reviews (remove abusive or fake reviews)
- [ ] Spot-check queue for AI-generated post-lesson recaps (quality/safety review)

**Account control**
- [ ] Suspend / reinstate tutor or student accounts
- [ ] Appeal handling for suspended accounts
- [~] Dispute resolution view — admin `/trust/disputes` renders disputes; filing from
      the hub (`trust-safety/file-dispute`) is not wired
- [ ] View-as / impersonation for support troubleshooting (permission-gated, logged)

**Financial control**
- [ ] Configure take-home percentages per tutor level (Entry / Established / Expert)
- [ ] Configure default per-segment pricing for each level (₦/$ per 15-minute
      segment)
- [ ] Configure Mojo+ subscription price, take-home bonus, and perks
- [ ] Configure level-progression thresholds (hours taught, rating floor)
- [ ] Manually promote, demote, or override a tutor's level
- [ ] Configure trial lesson discount rules
- [ ] Manual wallet adjustments (refunds, goodwill credits)
- [ ] Payout approval / oversight for tutor withdrawals
- [ ] Transaction ledger and audit log across all wallets
- [ ] Revenue reporting — commission earned, Mojo+ subscription revenue, trial
      subsidy cost, by period

**Marketplace configuration**
- [ ] Manage subject/category taxonomy (including exam-prep verticals as they're added)
- [ ] Manage supported languages
- [ ] Configure referral program rewards (student track and tutor track separately)
- [ ] Feature/pin tutors editorially (homepage, category pages)
- [ ] Configure cancellation & no-show policy thresholds

**Analytics & reporting**
- [ ] Platform-wide metrics dashboard — active tutors, active students, GMV, lesson
      volume, trial-to-paid conversion
- [ ] Tutor performance leaderboard (response time, conversion, cancellation rate)
- [ ] Cohort / retention reporting for students and tutors separately

**System administration**
- [ ] Role & permission management (assign additional admins, scope their access)
- [ ] Feature flag toggles for phased rollout
- [ ] Broadcast / system-wide notifications (maintenance, policy changes)
- [ ] Manage help center / FAQ content
- [ ] Audit log of admin actions

---

## Tutor

**Onboarding & profile**
- [~] Multi-section application — wizard covers subjects, bio, certifications/experience,
      intro video, and account (with signup); **missing** photo, education,
      availability & timezone capture. Level/price intentionally not set — Entry by default
- [ ] View application status
- [ ] Edit profile post-approval (triggers re-review)
- [ ] Adjust subjects taught over time

**Availability & scheduling**
- [x] Set recurring weekly availability
- [ ] Add one-off exceptions (time off, extra hours)
- [~] Set buffer time between sessions and minimum booking notice — minimum notice
      only; no inter-session buffer
- [x] View calendar (week view of upcoming and past sessions)
- [~] Reschedule or cancel a session, subject to the cancellation policy — cancel is
      built; **reschedule** is not (no use-case, route, or UI)

**Teaching**
- [x] Access the in-platform virtual lab (video, whiteboard, chat, file sharing)
- [~] Mark a lesson complete, cancelled, or no-show — completion is student-confirm
      only (`POST /api/sessions/[id]/confirm`); no tutor-side action and no no-show state
- [ ] Add private notes on a lesson or student
- [~] Review and edit the AI-generated post-lesson recap before it's sent — recap is
      generated on `SessionCompleted` but not yet rendered anywhere
- [ ] Assign daily practice or scenario drills tied to a lesson

**Students & messaging**
- [ ] View student roster and per-student lesson history
- [ ] Pre-booking chat with prospective students (use-case exists; not wired)
- [ ] Respond to incoming trial lesson requests

**Earnings & payouts**
- [~] View wallet balance and full transaction history — balance shown on tutor home;
      no ledger/history view
- [~] View current level (Entry / Established / Expert), take-home percentage, and
      progress toward the next level — level shown; progress-to-next not
- [ ] Subscribe to or cancel **Mojo+** (adds +10 points of take-home and unlocks
      custom per-segment pricing) — use-case exists in the lib; no UI
- [ ] Set a custom per-segment price, if subscribed to Mojo+
- [x] Withdraw funds (demo rail via `POST /api/payouts`; Paystack/Flutterwave on the
      Prisma path)
- [ ] View payout history and status

**Performance & growth**
- [~] View own ranking-relevant stats — response time, trial-to-paid conversion,
      cancellation rate — performance card on tutor home; conversion/cancellation split
      is partial
- [~] View reviews and ratings received — aggregate rating badge only; no per-review list
- [ ] Access personal referral link and track referral rewards
- [ ] See guidance on what would improve profile ranking

---

## Student

**Discovery & booking**
- [~] Set learning goals / subject / proficiency level at signup, to shortlist
      relevant tutors — captured at signup; not yet surfaced as a shortlist
- [~] Search and filter tutors — subject + level only in the UI; the demo search
      index ignores filters, and language / availability / rating aren't exposed
- [~] View a tutor's full profile — bio, level, price/segment, avatar, and basic
      stats shown; intro video, review list, and certifications are not surfaced
- [x] Save / shortlist favorite tutors
- [~] Book a trial lesson at the discounted rate — `isTrial` bookings exist; the
      discounted price isn't shown at checkout (no student checkout at all yet)
- [ ] Request a free replacement lesson if the trial isn't a fit
- [ ] Start, adjust, or cancel a recurring subscription with a chosen tutor
- [~] Reschedule or cancel an upcoming lesson, subject to the cancellation policy —
      cancel only; reschedule isn't built

**Learning**
- [x] Access the in-platform virtual lab
- [~] View full lesson history — sessions list on student home; no dedicated page or
      recap
- [ ] View the AI-generated post-lesson recap after each session (generated, not rendered)
- [ ] Complete assigned daily practice and scenario drills
- [ ] Track progress over time

**Payments & subscription**
- [ ] Manage payment method (Paystack/Flutterwave, card)
- [ ] Adjust lesson frequency on an active subscription
- [ ] View payment history and receipts
- [ ] Pause or cancel a subscription

**Community & trust**
- [ ] Leave a public rating and written review after a completed lesson (use-case
      exists; not wired)
- [ ] Message a tutor before booking (use-case exists; not wired)
- [ ] Access personal referral link and track rewards

---

Cross-check against the roadmap before treating this as final — a few items here
(AI recap review, scenario drills, exam-prep taxonomy) belong to later phases and
aren't meant to ship with the Phase 1 core loop.
