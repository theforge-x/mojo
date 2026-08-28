# Mojo — Feature & Development Roadmap
### A tutoring marketplace built for a solo developer and a Nigeria-first launch

This roadmap breaks Mojo into shippable phases. Each phase describes a specific
mechanic — not just a UI — and the reasoning behind it, so the *why* survives even
as the exact numbers get tuned. Nigeria's market conditions shape several of the
calls directly: payment rails, payout methods, and bandwidth-conscious video are
treated as first-class decisions from the start, not afterthoughts bolted onto
assumptions built for card-and-wallet markets elsewhere.

Built solo, phases are scoped so each one is a usable product on its own — not a slice
of a bigger thing that only works once everything else exists.

---

## Phase 0 — Foundations (mostly done)

| Item | Status | Notes |
|---|---|---|
| Design system (Tailwind v4 tokens, shadcn-style components) | ✅ Done | Mint/coral/yellow on navy-and-paper, Manrope/DM Sans/DM Mono |
| Tutor availability & lesson calendar (Next.js, Prisma, Postgres/Supabase) | 🔄 In progress | Recurring rules, exceptions, conflict detection, reminders — this *is* the scheduling engine every booking flow below sits on top of |

Everything in Phase 1 assumes the calendar system's data model (availability rules,
exceptions, session status) is stable. Don't start the booking flow until sessions can
be reliably created, conflict-checked, and cancelled through it.

It's worth treating the session record as load-bearing for more than scheduling —
Phase 2's entire commission model, Phase 3's AI trigger, and most of the dashboard
overview widgets in the companion docs all read off it. Concretely, a session record
needs to carry: **start/end timestamps** (segment count derives from these), **the
segment price and level locked in at booking time** — not recalculated later if the
tutor's level or Mojo+ status changes mid-subscription — **status transition
timestamps** (booked → confirmed → completed / cancelled / no-show, each
timestamped, since response-time and cancellation-rate ranking both come from this),
and a **completion-confirmation state** (who confirmed delivery, and when) that gates
the payout release described in Phase 2. Getting this schema right early avoids
backfilling it once levels, payouts, and rankings are all already reading from it.

---

## Phase 1 — Marketplace core (MVP)

The goal of this phase alone: a tutor can be found, booked for a trial, and paid for a
completed lesson. Nothing else matters until this loop works end to end.

**Tutor profile & application**
A multi-section application — photo, intro video, certifications, education, written
bio, subjects, availability & timezone — with a manual or semi-automated review
queue before a profile goes live. Keep the bar low on formal credentials: age, a
working camera/mic, and the right to teach the subject is enough to apply. Let the
bio, video, and reviews do the trust-building instead of gatekeeping tutors out at
signup.

Pricing isn't part of the application — every tutor starts at the **Entry** level
and bills at Entry's fixed rate (see *Tutor levels, commission & Mojo+*, Phase 2).
There's nothing to negotiate here, which keeps this flow simple and keeps price out
of the trust-building problem it's solving.

**Tutor search & discovery**
Filter by subject, price band (Entry / Established / Expert, plus Mojo+ tutors who've
set a custom rate), availability window, language spoken, and rating. Tutor cards
show photo, intro video thumbnail, price per 15-minute segment, and response time —
response time matters enough as a ranking input (see *Tutor ranking*, Phase 2) that
it's worth surfacing to students directly, not just using it internally.

**Trial lesson + booking flow**
A first lesson at a reduced, platform-subsidized price, booked straight against the
tutor's live availability from Phase 0. Pair it with a **free replacement lesson**
guarantee if the trial tutor isn't a fit — this is the mechanic that makes a paid
trial feel as safe as a free one, and it's cheap to offer since it only fires on a
minority of mismatches.

**Virtual lab**
Video call + shared whiteboard + text chat + file sharing, embedded in-platform —
build or license this rather than punting students to a generic video-call link. An
in-platform lab is part of what makes Mojo feel like one product instead of a
booking form bolted onto a video app.

**Payments — Nigeria-first**
Every lesson bills in **15-minute segments** — the base pricing unit for the whole
product, not just an accounting detail. A 30-minute lesson is 2 segments, a
60-minute lesson is 4, and a session can run for as many segments as tutor and
student book. Segment price is fixed by the tutor's level unless they've subscribed
to Mojo+ (Phase 2) — ₦4,000/$4 (Entry), ₦6,000/$6 (Established), ₦8,000/$8 (Expert)
per segment as the platform defaults.

On top of that per-segment price, Mojo runs on a recurring subscription per tutor —
a fixed lesson count auto-charged on a repeating cycle — with tutor earnings held in
an internal wallet:
- Primary rails: **Paystack** and/or **Flutterwave** for card, bank transfer, and USSD.
- Consider mobile money support depending on target country mix.
- Keep an internal wallet/ledger model regardless of rail — it's what makes refunds,
  the trial subsidy, and tutor payouts tractable without touching the payment
  processor for every internal movement.
- Card-based international rails (Stripe) as a secondary option only if diaspora
  students are part of the plan.

**Messaging**
Pre-booking chat between student and prospective tutor, gated to logged-in users to
keep it out of spam/scam territory.

**Reviews**
Public rating + written review, unlocked after a lesson is marked complete.

**Notifications**
Email plus calendar sync covers the baseline, but **WhatsApp** should be a
first-class channel alongside email for lesson reminders, cancellations, and payment
confirmations — it has far better open rates than email in this market and doesn't
depend on a stable data connection the way push notifications through a native app
would this early.

---

## Phase 2 — Trust, retention & tutor economics

Once the core loop works, this phase is about making tutors want to stay and students
want to come back.

**Tutor levels, commission & Mojo+**
Every tutor sits at one of three levels — **Entry**, **Established**, or **Expert**
— and take-home percentage is set by level, not negotiated per tutor:

| Level | Take-home | Platform commission |
|---|---|---|
| Entry | 50% | 50% |
| Established | 60% | 40% |
| Expert | 70% | 30% |

**Mojo+** is a tutor-side subscription layering two perks on top of whichever level
a tutor is at:
- **+10 percentage points of take-home** at every level — Entry becomes 60%,
  Established 70%, Expert 80%.
- **Custom pricing** — without Mojo+, a tutor's segment price is fixed by their
  level. With Mojo+, they set their own price per segment instead of the platform
  default.

That pairing is deliberate. Mojo+ is worth the most to a tutor confident enough in
their own demand to want pricing control — and that's exactly the tutor Mojo most
needs to keep from drifting to a competitor, so the subscription effectively sells
itself to the tutors whose retention matters most. It's also a second revenue line
independent of commission: Mojo earns from the subscription fee itself, not only
from a cut of lessons, which starts to matter once enough tutors are on the platform
for subscription attach rate to move the numbers on its own.

**Billing mechanics worth being precise about:**
- **Segments are the pricing atom, not the lesson.** Every lesson bills in
  15-minute segments (Phase 1) at ₦4,000/$4 (Entry), ₦6,000/$6 (Established), or
  ₦8,000/$8 (Expert) per segment — or a tutor's custom Mojo+ rate. A lesson's total
  price is segments × segment rate. Decide the rounding rule now for a lesson that
  doesn't land on a clean 15-minute boundary — rounding up to the next full segment
  is the simplest to build and to explain to students.
- **The level sets the price by default; only Mojo+ overrides it.** Without Mojo+, a
  tutor charges exactly their level's fixed rate — there's no per-tutor negotiation
  happening anywhere else in the product.
- **The trial lesson bypasses take-home entirely** — see below.

*Worked example:* an Established tutor without Mojo+ (60% take-home) teaches a
60-minute lesson — 4 segments × ₦6,000 = ₦24,000 total. They keep ₦14,400; Mojo
keeps ₦9,600. The same tutor **with** Mojo+ (70% take-home) keeps ₦16,800 on an
identical lesson — the kind of gap that makes the subscription pay for itself
quickly for anyone teaching real volume.

Exact level-progression thresholds still need defining during build, but the shape
worth keeping is the same logic the rest of the platform runs on: gate advancement
on proof, not tenure alone — cumulative hours taught *and* a rating/cancellation-rate
floor, so a tutor can't level up on volume while quietly delivering a worse
experience. (A starting point to refine, not a commitment: Entry → Established
around 50 hours taught with a rating ≥4.5; Established → Expert around 200 hours
with a rating ≥4.7.)

The commission side of this is doing two jobs at once. First, it prices in risk: an
Entry-level tutor costs the platform more per lesson in support, moderation, and
refunded bad trials than an Expert with a long, verified track record, so a bigger
cut on unproven supply is a defensible risk premium rather than an arbitrary tax.
Second, it's a retention lever against disintermediation — once a tutor has leveled
up and built a roster of loyal students through the platform, a meaningfully lower
commission (and Mojo+'s extra 10 points on top of it) is what keeps *staying*
cheaper than quietly moving those relationships off-platform — a direct bank
transfer, a WhatsApp arrangement — and paying nothing at all. For that to actually
work, the top-end take-home rate has to stay high enough that "still on the
platform" beats "gone independent," worth stress-testing against what an
Expert-level tutor could realistically get away with off-platform.

The trial lesson sits outside all of this. Whatever a tutor's level, price, or
Mojo+ status, **the trial lesson always pays the tutor ₦0** — the student pays a
discounted trial price, and Mojo keeps 100% of it. The trial isn't really the
product being sold; it's an audition for a recurring, commission-paying
relationship, and every subsequent lesson bills normally at the tutor's level (or
Mojo+) rate. That's also why trial-to-paid conversion rate shows up again below as a
tutor-ranking input (see *Tutor ranking*) — the same mechanic does double duty as
both an acquisition subsidy and a quality signal: tutors who convert well get ranked
higher, which sends them more trials, which (if they keep converting) compounds.

That combination — level-gated commission, a paid upgrade for tutors who want
pricing control, and a trial lesson that costs the platform nothing but one lesson's
worth of a tutor's uncompensated time — is the core of Mojo's tutor economics.

**Tutor payouts**
Internal wallet → withdrawal, with a minimum threshold and a clear processing window.
For Mojo: **bank transfer via Paystack/Flutterwave payouts** for local tutors,
Payoneer or Wise as a fallback for tutors outside Nigeria if the tutor pool goes
regional. Confirmation-based release (student confirms the lesson happened, or an
auto-confirm window elapses) is what keeps Mojo from paying out on disputed sessions.

**Tutor ranking**
Rank search results on response time, trial-to-paid conversion rate, and
tutor-initiated cancellation rate — and **show tutors their own numbers** rather than
keeping the algorithm invisible. A tutor statistics tab that explains *why* a profile
ranks where it does is a retention feature, not just an internal scoring system.

**Referral program**
Separate student and tutor referral tracks, each with its own reward (a discount for
the invitee, a wallet credit for the referrer once the invitee completes a paid
lesson). Track it with a referral dashboard so advocates can see status, not just a
one-time code.

**Cancellation & dispute policy**
Explicit rules for late cancellation, no-shows on both sides, and how a disputed
"was this lesson delivered" claim gets resolved — this needs to exist before volume
makes manual resolution unsustainable.

**Admin tooling**
Tutor application review queue, profile suspension/appeal flow, and a basic dispute
resolution view. Unglamorous, but it's the thing that keeps Phase 1's low application
bar from becoming a trust problem at scale.

---

## Phase 3 — AI-assisted learning layer

Mojo's AI layer is built to enhance tutors, not replace them — three features to
build:

- **Post-lesson recap** — after each lesson, an LLM-generated summary from the
  session transcript: what was covered, specific feedback, and what to focus on
  next. Cuts the tutor's post-lesson admin work and gives the student something
  concrete between sessions.
- **Daily practice** — short, self-paced exercises pulled from that lesson's actual
  content and the student's stated focus areas, not a generic drill bank.
- **Scenario drills** — tutor-assigned, realistic practice tasks students do solo
  between lessons, aimed at the specific thing they're working toward (an
  interview, a trip, an exam).

This phase depends on reliable session recording/transcription and an LLM API
integration — sequence it after Phase 1–2 are load-bearing, since it's additive
polish on top of a working marketplace, not a substitute for one.

---

## Phase 4 — Scale

- **Native mobile apps** (iOS/Android) once the web product's core flows are stable —
  treat the app as a first-class surface eventually, but building it too early splits
  a solo dev's attention before the web flow is proven.
- **Institutional/B2B accounts** — seat-based access for schools or companies, admin
  dashboards, centralized billing. Only worth building once organic B2C demand
  validates the core product.
- **Broader subject coverage** — start beyond languages alone, into exam prep,
  academics, and hobbies. For Nigeria specifically, exam-prep verticals (WAEC,
  JAMB/UTME, NECO) are worth evaluating as an early differentiator rather than a
  Phase 4 afterthought, if early user research supports it.
- **Multi-currency / regional expansion** beyond the initial market.

---

## Deliberately deferred

- **Group/cohort classes** — not core to Mojo's 1:1 model; treat as a future
  experiment, not a roadmap gap.
- **A public, tunable ranking algorithm** — start simple (response time, conversion,
  cancellation rate as inputs) and resist over-engineering the scoring formula before
  there's enough tutor volume for it to matter.
- **In-house video infrastructure** — license a video SDK (e.g. one with strong
  adaptive-bitrate behavior for inconsistent mobile-data connections) rather than
  building WebRTC infrastructure from scratch; that's an operational cost worth
  paying for as a solo developer.
