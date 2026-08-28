# Mojo — Settings by Role

Distinct from the dashboard nav (what you *do*) and the permissions matrix (what
you're *allowed* to do) — this is configuration: how the product behaves for a given
account. Checklist format again, to match the other companion docs.

---

## Shared across all roles

- [ ] Name, photo, email
- [ ] Password change
- [ ] Timezone and locale/language
- [ ] Notification channels — email vs. WhatsApp, toggled per notification type
      (reminders, messages, payments, product updates)
- [ ] Active sessions / login history, with remote sign-out
- [ ] Who can message me (open / verified-contact-only)
- [ ] Data export
- [ ] Delete account

---

## Admin

- [ ] Own account settings (shared list above)
- [ ] Admin notification routing — which alert types reach this admin specifically
      (new applications, disputes, flagged content, payout requests) — matters once
      there's more than one admin and they're not all watching the same queues
- [ ] 2FA — enforced, not optional, given the reach of an admin account
- [ ] Session timeout / auto-logout duration
- [ ] Own permission scope, read-only — what this specific admin account can and
      can't do, once scoped admin roles exist (see the permissions matrix note on
      `admin_role.assign`)
- [ ] Default currency/region for reports and dashboards

## Tutor

- [ ] Own account settings (shared list above)
- [ ] **Scheduling defaults** — default session length, buffer time between
      sessions, minimum booking notice (all feed the calendar system directly)
- [ ] **Vacation / pause mode** — stop new bookings without touching existing
      availability rules or cancelling confirmed sessions
- [ ] **Payout settings** — preferred method (Paystack/Flutterwave bank transfer,
      Payoneer, Wise), payout threshold, bank/account details
- [ ] **Mojo+ management** — subscribe/cancel, billing details for the subscription
      itself (separate from lesson payments), view custom pricing if subscribed
- [ ] Auto-decline rules for trial requests outside set hours
- [ ] Profile visibility — whether phone/contact details are shown to matched
      students
- [ ] Tax/compliance info, if Mojo ends up needing it for payout reporting

## Student

- [ ] Own account settings (shared list above)
- [ ] **Payment methods** — saved cards / Paystack-Flutterwave-linked accounts,
      default method
- [ ] **Subscription settings** — auto-renew toggle, reminder timing before the
      next charge, per active tutor subscription
- [ ] Learning profile — subjects, goals, proficiency level set at signup, editable
      later (this is what discovery matching reads from)
- [ ] Lesson reminder timing (independent of the channel toggle above — *when*
      before a lesson, not *how*)
- [ ] Review visibility — whether past reviews I've written show my full name or
      just initials

---

A design call worth making explicitly, since it touches both Tutor settings and the
Phase 2 pricing model: if a tutor changes their scheduling defaults or Mojo+ status
mid-subscription, does an already-booked future session honor the *old* settings or
the *new* ones? The Phase 0 note in the roadmap already settles this for price —
locked at booking time — the same logic should probably extend to buffer time and
minimum notice, so a setting change never silently invalidates a lesson a student
already booked in good faith.
