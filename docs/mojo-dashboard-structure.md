# Mojo — Dashboard Structure by Role

Same feature set as the permissions matrix, reorganized as information architecture:
what greets each role on login, what lives in their navigation, and what gets
surfaced as a one-tap action rather than buried in a menu.

---

## Admin

**Home — overview widgets**
- Pending tutor applications (count, links to queue)
- Open disputes (count)
- GMV and commission revenue, this period
- Active tutors / active students, with trend vs. last period
- Mojo+ subscribers (count and subscription revenue)
- Flagged content awaiting review (reviews, AI recaps)

**Navigation**

| Section | Contains |
|---|---|
| Overview | The widgets above |
| Tutors | Application queue, directory, levels & progression, suspensions/appeals |
| Students | Directory, suspensions/appeals |
| Sessions | All bookings, disputes, cancellation/no-show log |
| Finance | Wallets & transactions, payout approvals, commission & segment pricing config, Mojo+ config, revenue reports |
| Marketplace | Subjects/languages, referral program, trial discount rules, featured tutors |
| Analytics | Platform metrics, tutor leaderboard, retention/cohorts |
| System | Admin roles & permissions, feature flags, broadcasts, help content, audit log |

**Quick actions**
- Review the next pending application
- Resolve the oldest open dispute
- Send a broadcast notification

---

## Tutor

**Home — overview widgets**
- Today's sessions (agenda view)
- Earnings this period + wallet balance
- Current level and progress toward the next one
- Mojo+ status (with an upgrade prompt if not subscribed)
- Pending trial requests
- Unread messages

**Navigation**

| Section | Contains |
|---|---|
| Overview | The widgets above |
| Calendar | Availability editor, upcoming and past sessions |
| Students | Roster, messages, trial requests |
| Earnings | Wallet & transactions, payouts, level & Mojo+ |
| Profile | Application/profile editor, subjects taught |
| Performance | Own stats (response time, conversion, cancellation rate), reviews received |
| Referrals | Referral link & reward tracking |

**Quick actions**
- Set today's availability
- Respond to a trial request
- Withdraw funds
- Upgrade to Mojo+ *(hidden once subscribed)*

---

## Student

**Home — overview widgets**
- Next upcoming lesson, with a join link if it's starting soon
- Latest post-lesson AI recap
- Pending daily practice / scenario drills
- Saved/favorite tutors
- Active subscription status

**Navigation**

| Section | Contains |
|---|---|
| Overview | The widgets above |
| Find a tutor | Search & filters, favorites |
| My tutors | Booked tutors, message history |
| Lessons | Upcoming, history, recaps & practice |
| Payments | Payment methods, subscription management, history/receipts |
| Referrals | Referral link & reward tracking |

**Quick actions**
- Book a trial lesson
- Message a tutor
- Leave a review for the last lesson
- Join now *(only shown when a session is imminent)*

---

Each nav item and quick action here should map back to a permission key in the
matrix — if something's listed on a dashboard but has no corresponding row there,
that's a gap in one of the two documents worth resolving before build.
