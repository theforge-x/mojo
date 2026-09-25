# Mojo — Permissions Matrix

Every discrete action in the product, as a flat registry rather than a per-role
checklist — this is what a role/permission system actually gets built from. Each row
is a candidate row in a `permissions` table; each role column is its default grant.

**Legend:** `✓` = unrestricted · `Own` = allowed, but scoped to the actor's own
data only · `—` = not permitted. "Guest" means unauthenticated.

Treat the Admin column as the default **Admin** role's grants, not a hard ceiling —
*System administration* below covers assigning other admins narrower, scoped
permission sets, so a future "support admin" role isn't stuck with the same access
as a full admin from day one.

---

### Account & access

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `auth.sign_up` | Create an account | ✓ | — | — | — |
| `auth.log_in` | Log in | ✓ | — | — | — |
| `auth.reset_password` | Request/complete a password reset | ✓ | — | — | — |
| `account.edit_profile` | Edit own name, photo, timezone, locale | — | Own | Own | Own |
| `account.manage_notifications` | Set notification channel preferences | — | Own | Own | Own |
| `account.delete` | Delete own account / export personal data | — | Own | Own | Own |
| `help.view` | Access the help center | ✓ | ✓ | ✓ | ✓ |

### Tutor onboarding & profile

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `tutor_application.submit` | Submit the multi-section application | — | — | Own | — |
| `tutor_application.view_status` | Check own application status | — | — | Own | ✓ |
| `tutor_application.review` | Approve / reject / request changes | — | — | — | ✓ |
| `tutor_profile.edit` | Edit own profile (triggers re-review) | — | — | Own | — |
| `tutor_profile.view` | View a tutor's public profile | ✓ | ✓ | ✓ | ✓ |
| `tutor_profile.moderate` | Moderate photos, video, bio content | — | — | — | ✓ |
| `tutor_subjects.edit` | Edit subjects taught | — | — | Own | — |

### Search & discovery

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `tutor_search.browse` | Search / filter tutors | ✓ | ✓ | ✓ | ✓ |
| `tutor_favorite.manage` | Save / remove a shortlisted tutor | — | Own | — | — |

### Scheduling & sessions

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `availability.edit` | Set recurring availability | — | — | Own | Any |
| `availability_exception.edit` | Add a one-off exception | — | — | Own | Any |
| `session.book_trial` | Book a trial lesson | — | Own | — | — |
| `session.book_recurring` | Book against a subscription | — | Own | — | — |
| `session.reschedule` | Reschedule a session | — | Own | Own | Any |
| `session.cancel` | Cancel a session | — | Own | Own | Any |
| `session.mark_complete` | Mark a lesson delivered | — | — | Own | Any |
| `session.mark_no_show` | Mark a no-show | — | — | Own | Any |
| `session.confirm_delivery` | Confirm a lesson happened (releases payout) | — | Own | — | Any |
| `session.request_replacement` | Request a free replacement trial | — | Own | — | — |

### Lab & teaching

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `lab.join` | Enter the virtual lab | — | Own | Own | — |
| `lesson_notes.add` | Add private notes on a lesson/student | — | — | Own | — |
| `ai_recap.view` | View the post-lesson AI recap | — | Own | Own | — |
| `ai_recap.edit` | Edit own recap before it's sent | — | — | Own | — |
| `ai_recap.moderate` | Review flagged recaps | — | — | — | ✓ |
| `practice.assign` | Assign daily practice / scenario drills | — | — | Own | — |
| `practice.complete` | Complete assigned practice | — | Own | — | — |

### Messaging & reviews

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `message.send` | Pre-booking chat | — | Own | Own | — |
| `review.submit` | Leave a rating/review after a lesson | — | Own | — | — |
| `review.moderate` | Remove or flag a review | — | — | — | ✓ |

### Payments & wallet

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `payment_method.manage` | Add/remove a payment method | — | Own | — | — |
| `subscription.manage` | Adjust, pause, or cancel a subscription | — | Own | — | — |
| `wallet.view_balance` | View wallet balance | — | — | Own | Any |
| `wallet.view_transactions` | View transaction history | — | — | Own | Any |
| `wallet.withdraw` | Withdraw funds | — | — | Own | — |
| `wallet.manual_adjust` | Manually credit/debit a wallet | — | — | — | ✓ |
| `payout.approve` | Approve a pending payout | — | — | — | ✓ |

### Levels, commission & Mojo+

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `level.view_progress` | View own level and progress | — | — | Own | ✓ |
| `level.configure_thresholds` | Set hours/rating thresholds per level | — | — | — | ✓ |
| `level.override` | Manually promote/demote a tutor | — | — | — | ✓ |
| `commission.configure_rates` | Set take-home % per level | — | — | — | ✓ |
| `segment_pricing.configure_defaults` | Set default ₦/$ per segment, per level | — | — | — | ✓ |
| `mojo_plus.subscribe` | Subscribe to Mojo+ | — | — | Own | — |
| `mojo_plus.cancel` | Cancel Mojo+ | — | — | Own | — |
| `mojo_plus.set_custom_price` | Set a custom segment price (requires Mojo+) | — | — | Own | — |
| `mojo_plus.view_outreach` | See interested students + message them first (requires Mojo+) | — | — | Own | — |
| `mojo_plus.configure_terms` | Set Mojo+ price, take-home bonus, perks | — | — | — | ✓ |

### Referrals

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `referral.get_link` | Get a personal referral link | — | Own | Own | — |
| `referral.configure_rewards` | Set referral reward amounts | — | — | — | ✓ |

### Disputes & trust

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `dispute.file` | File a dispute on a session | — | Own | Own | — |
| `dispute.resolve` | Resolve a filed dispute | — | — | — | ✓ |
| `account.suspend` | Suspend a student or tutor account | — | — | — | ✓ |
| `account.appeal` | Appeal own suspension | — | Own | Own | — |
| `account.view_as` | Impersonate a user for troubleshooting | — | — | — | ✓ |

### Marketplace configuration

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `taxonomy.manage_subjects` | Manage subject/category list | — | — | — | ✓ |
| `taxonomy.manage_languages` | Manage supported languages | — | — | — | ✓ |
| `tutor.feature_pin` | Editorially feature/pin a tutor | — | — | — | ✓ |
| `policy.configure_cancellation` | Set cancellation/no-show policy | — | — | — | ✓ |
| `trial.configure_discount` | Set the trial lesson discount rule | — | — | — | ✓ |

### Analytics & reporting

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `analytics.view_platform` | View platform-wide metrics | — | — | — | ✓ |
| `analytics.view_leaderboard` | View tutor performance leaderboard | — | — | — | ✓ |
| `analytics.view_own_stats` | View own ranking-relevant stats | — | — | Own | ✓ |
| `analytics.view_retention` | View cohort/retention reporting | — | — | — | ✓ |

### System administration

| Action | Description | Guest | Student | Tutor | Admin |
|---|---|---|---|---|---|
| `admin_role.assign` | Grant another user admin access | — | — | — | ✓ |
| `feature_flag.toggle` | Toggle a feature flag | — | — | — | ✓ |
| `broadcast.send` | Send a system-wide notification | — | — | — | ✓ |
| `help_content.manage` | Edit help center / FAQ content | — | — | — | ✓ |
| `audit_log.view` | View the admin action audit log | — | — | — | ✓ |

---

A couple of these deserve a second look before they become permanent defaults:
`admin_role.assign` grants *any* admin the power to create more admins with the same
reach — worth restricting to a narrower "owner" tier once there's more than one
admin, rather than treating all admins as equal from the start. Same logic applies
to `account.view_as` and `wallet.manual_adjust` — both are the kind of action you
want logged and probably rate-limited even for legitimate admin use.
