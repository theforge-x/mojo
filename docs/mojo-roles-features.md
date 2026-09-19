# Mojo — Feature List by Role

A companion to the phased roadmap, organized by who uses each feature instead of when
it ships. Written as checklists — pull items into whichever phase they belong to as
you build.

Status as of 2026-09-19 (`dev` @ `b770057`): `[x]` built & wired · `[~]` partial
(exists but incomplete or unwired) · `[ ]` not started. The completion plan for the
Phase 1 loop is `docs/next-steps.md`.

---

## Shared across all roles

**Account & access**
- [x] Sign up / log in (email + password via `@mojo/identity`; **no** OAuth yet)
- [ ] Password reset / account recovery
- [~] Profile photo, display name, timezone, locale settings — display name +
      photo (5MB validated) + timezone captured on the tutor application and
      surfaced on profiles; generic timezone & locale prefs are not modeled
- [x] Notification channel preferences (email vs. WhatsApp vs. push, per notification type)
      — `GET/PUT /api/notifications/preferences` + `/settings` (reminders, recap,
      marketing); settings UI toggles email/whatsapp, push arrives via the
      device registry; timed reminders fire on cron workers
- [ ] Help center / support contact access
- [ ] Delete account / export personal data

---

## Admin

**Tutor & content oversight**
- [x] Tutor application review queue (approve / reject — the admin reads the
      hub's application queue over `HUB_URL`, and approval publishes a live,
      searchable tutor profile via `tutor-profile/review-application`;
      request-changes not present)
- [ ] Re-review queue for tutors who edit an already-approved profile
- [ ] Profile content moderation — photos, intro videos, written bios
- [ ] Review flagging for public reviews (remove abusive or fake reviews)
- [ ] Spot-check queue for AI-generated post-lesson recaps (quality/safety review)

**Account control**
- [ ] Suspend / reinstate tutor or student accounts
- [ ] Appeal handling for suspended accounts
- [x] Dispute resolution view — admin `/trust/disputes` renders disputes; hub
      filing wired (`POST /api/disputes` + `DisputeButton` on finished/cancelled
      cards, one open dispute per session)
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
- [x] Multi-section application — 8-step wizard covers displayName, photo, education,
      timezone, availability, subjects, languages, bio, certifications/experience,
      intro video, and account (with signup); approval publishes a live searchable
      profile at Entry. Level/price intentionally not set — Entry by default
- [x] View application status (`/apply`: pending / approved / rejected + submittedAt)
- [ ] Edit profile post-approval (triggers re-review) — rejected-resubmit is also a
      dead-end (no form, no reason surfaced)
- [ ] Adjust subjects taught over time

**Availability & scheduling**
- [x] Set recurring weekly availability
- [x] Add one-off exceptions (time off, extra hours)
- [x] Set buffer time between sessions and minimum booking notice, plus
      pause-new-bookings mode (slots hidden and bookings rejected while paused)
- [x] View calendar (week view of upcoming and past sessions, opened from a
      "This week" dialog trigger on both dashboards)
- [x] Reschedule or cancel a session, subject to the cancellation policy — cancel
      with auto-refund; reschedule moves in place (same id, exactly one charge)
      via the domain use-case for booked + confirmed sessions, student and tutor
      `RescheduleForm`

**Teaching**
- [x] Access the in-platform virtual lab (video, whiteboard, chat, file sharing)
- [x] Mark a lesson complete, cancelled, or no-show — student `Confirm delivery`
      (`POST /api/sessions/[id]/confirm`), tutor complete
      (`POST /api/sessions/[id]/complete`), tutor cancel + `NoShowButton`,
      tutor `Start live lab`, plus the auto-confirm worker so a silent student
      never stalls payout/recap
- [ ] Add private notes on a lesson or student
- [x] Review the AI-generated post-lesson recap — generated on `SessionCompleted`
      and rendered both sides via `RecapCard` (no tutor edit-before-send)
- [ ] Assign daily practice or scenario drills tied to a lesson

**Students & messaging**
- [ ] View student roster and per-student lesson history (tutor row shows a
      `studentId` placeholder, no real name)
- [x] Pre-booking chat with prospective students (`POST/GET /api/messages`,
      `/messages` + `MessageChat` composer, auth-gated)
- [ ] Respond to incoming trial lesson requests

**Earnings & payouts**
- [~] View wallet balance and full transaction history — balance shown on tutor home;
      no ledger/history view
- [~] View current level (Entry / Established / Expert), take-home percentage, and
      progress toward the next level — level shown; progress-to-next not
- [x] Subscribe to or cancel **Mojo+** (adds +10 points of take-home and unlocks
      custom per-segment pricing) — `GET/POST /api/mojo-plus` + tutor dashboard
      card with bounded rates
- [ ] Set a custom per-segment price, if subscribed to Mojo+
- [x] Withdraw funds (demo rail via `POST /api/payouts`; Paystack/Flutterwave on the
      Prisma path)
- [ ] View payout history and status

**Performance & growth**
- [~] View own ranking-relevant stats — response time, trial-to-paid conversion,
      cancellation rate — performance card on tutor home; conversion/cancellation split
      is partial
- [~] View reviews and ratings received — aggregate badge + first-10 review list on
      the tutor profile; no edit/delete/reply/moderation
- [ ] Access personal referral link and track referral rewards
- [ ] See guidance on what would improve profile ranking

---

## Student

**Discovery & booking**
- [~] Set learning goals / subject / proficiency level at signup, to shortlist
      relevant tutors — subject intent is captured (landing search →
      `signup?subject=` → filtered directory); goals/level are not captured
- [x] Search and filter tutors — subject (domain-tabbed picker), level, language, rating,
      availability-window all filter in demo + Prisma + UI (only intro-video
      thumbnails missing)
- [~] View a tutor's full profile — bio, level, price/segment, avatar, languages,
      stats, and first-10 reviews shown; intro video and certifications are not
      surfaced
- [x] Save / shortlist favorite tutors
- [x] Book a trial lesson at the discounted rate — `isTrial` bookings charge at
      booking (50% off, one-per-tutor guard, banner + totals pre-book, receipt on
      `/payments`); real Paystack rail (redirect + saved-card) with quote endpoint
- [x] Free replacement lesson if the trial isn't a fit — cancelling a trial banks
      a single-use `ReplacementGrant`, redeemed at checkout for ₦0 (automatic,
      no separate request step)
- [ ] Start, adjust, or cancel a recurring subscription with a chosen tutor
- [x] Reschedule or cancel an upcoming lesson, subject to the cancellation policy —
      cancel + auto-refund; reschedule moves in place with exactly one charge
      (booked + confirmed, both roles)

**Learning**
- [x] Access the in-platform virtual lab
- [x] View full lesson history + AI recap — sessions list on student home with
      `RecapCard` on `completed` (no dedicated lessons page)
- [x] View the AI-generated post-lesson recap after each session
- [ ] Complete assigned daily practice and scenario drills
- [ ] Track progress over time

**Payments & subscription**
- [x] Manage payment method (Paystack redirect + saved-card authorizations listed
      in settings; demo stub via `provisionDemoMethod` when unconfigured)
- [ ] Adjust lesson frequency on an active subscription
- [x] View payment history and receipts (`/payments`: totals, segment/trial/refund
      breakdown, cancelled-only `Refund`)
- [ ] Pause or cancel a subscription

**Community & trust**
- [x] Leave a public rating and written review after a completed lesson (gated to
      `completed`, one per session)
- [x] Message a tutor before booking (`/messages` + composer)
- [ ] Access personal referral link and track rewards

---

Cross-check against the roadmap before treating this as final — a few items here
(AI recap review, scenario drills, exam-prep taxonomy) belong to later phases and
aren't meant to ship with the Phase 1 core loop.
