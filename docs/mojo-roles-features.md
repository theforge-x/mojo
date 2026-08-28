# Mojo — Feature List by Role

A companion to the phased roadmap, organized by who uses each feature instead of when
it ships. Written as checklists — pull items into whichever phase they belong to as
you build.

---

## Shared across all roles

**Account & access**
- [ ] Sign up / log in (email + password, or OAuth)
- [ ] Password reset / account recovery
- [ ] Profile photo, display name, timezone, and locale settings
- [ ] Notification channel preferences (email vs. WhatsApp, per notification type)
- [ ] Help center / support contact access
- [ ] Delete account / export personal data

---

## Admin

**Tutor & content oversight**
- [ ] Tutor application review queue (approve / reject / request changes)
- [ ] Re-review queue for tutors who edit an already-approved profile
- [ ] Profile content moderation — photos, intro videos, written bios
- [ ] Review flagging for public reviews (remove abusive or fake reviews)
- [ ] Spot-check queue for AI-generated post-lesson recaps (quality/safety review)

**Account control**
- [ ] Suspend / reinstate tutor or student accounts
- [ ] Appeal handling for suspended accounts
- [ ] Dispute resolution view — "was this lesson delivered" claims, refund requests
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
- [ ] Multi-section application — photo, intro video, certifications, education,
      written bio, subjects, availability & timezone (level and price aren't set
      here — every tutor starts at Entry)
- [ ] View application status
- [ ] Edit profile post-approval (triggers re-review)
- [ ] Adjust subjects taught over time

**Availability & scheduling**
- [ ] Set recurring weekly availability
- [ ] Add one-off exceptions (time off, extra hours)
- [ ] Set buffer time between sessions and minimum booking notice
- [ ] View calendar (day / week / month) of upcoming and past sessions
- [ ] Reschedule or cancel a session, subject to the cancellation policy

**Teaching**
- [ ] Access the in-platform virtual lab (video, whiteboard, chat, file sharing)
- [ ] Mark a lesson complete, cancelled, or no-show
- [ ] Add private notes on a lesson or student
- [ ] Review and edit the AI-generated post-lesson recap before it's sent
- [ ] Assign daily practice or scenario drills tied to a lesson

**Students & messaging**
- [ ] View student roster and per-student lesson history
- [ ] Pre-booking chat with prospective students
- [ ] Respond to incoming trial lesson requests

**Earnings & payouts**
- [ ] View wallet balance and full transaction history
- [ ] View current level (Entry / Established / Expert), take-home percentage, and
      progress toward the next level
- [ ] Subscribe to or cancel **Mojo+** (adds +10 points of take-home and unlocks
      custom per-segment pricing)
- [ ] Set a custom per-segment price, if subscribed to Mojo+
- [ ] Withdraw funds (bank transfer via Paystack/Flutterwave; Payoneer/Wise for
      tutors outside Nigeria)
- [ ] View payout history and status

**Performance & growth**
- [ ] View own ranking-relevant stats — response time, trial-to-paid conversion,
      cancellation rate
- [ ] View reviews and ratings received
- [ ] Access personal referral link and track referral rewards
- [ ] See guidance on what would improve profile ranking

---

## Student

**Discovery & booking**
- [ ] Set learning goals / subject / proficiency level at signup, to shortlist
      relevant tutors
- [ ] Search and filter tutors — subject, level/price band (Entry / Established /
      Expert, or custom Mojo+ pricing), availability, language, rating
- [ ] View a tutor's full profile — bio, intro video, certifications, reviews,
      level, and price per 15-minute segment
- [ ] Save / shortlist favorite tutors
- [ ] Book a trial lesson at the discounted rate
- [ ] Request a free replacement lesson if the trial isn't a fit
- [ ] Start, adjust, or cancel a recurring subscription with a chosen tutor
- [ ] Reschedule or cancel an upcoming lesson, subject to the cancellation policy

**Learning**
- [ ] Access the in-platform virtual lab
- [ ] View full lesson history
- [ ] View the AI-generated post-lesson recap after each session
- [ ] Complete assigned daily practice and scenario drills
- [ ] Track progress over time

**Payments & subscription**
- [ ] Manage payment method (Paystack/Flutterwave, card)
- [ ] Adjust lesson frequency on an active subscription
- [ ] View payment history and receipts
- [ ] Pause or cancel a subscription

**Community & trust**
- [ ] Leave a public rating and written review after a completed lesson
- [ ] Message a tutor before booking
- [ ] Access personal referral link and track rewards

---

Cross-check against the roadmap before treating this as final — a few items here
(AI recap review, scenario drills, exam-prep taxonomy) belong to later phases and
aren't meant to ship with the Phase 1 core loop.
