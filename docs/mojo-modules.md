# Mojo — Modular Monolith Architecture

Everything in the roadmap, permissions matrix, and dashboard docs, translated into
module boundaries. One deployable app per surface (see the monorepo doc), but
internally split into modules that own their own data and talk to each other
through explicit interfaces and events — never by reaching into another module's
tables.

**Why a modular monolith and not services:** a solo developer doesn't have the
operational budget for distributed systems — no separate deploys, no network calls
between what should be one transaction, no distributed-tracing problem to debug
alone at 2am. A modular monolith gets the boundary discipline of microservices
(so nothing becomes spaghetti as the codebase grows) without the operational cost,
and — done right — every module here is already shaped so it *could* be extracted
into its own service later if a specific one ever needs to scale independently.
That's the whole point of paying for the boundaries now.

---

## Dependency layering

Modules depend **downward only**, through another module's public API (its
`application` layer — see the monorepo doc) or through domain events, never by
importing another module's `domain` or `infrastructure` layers directly, and never
sideways within the same tier except via events.

> **Enforced in code (as built).** This is the *intent*; the enforced rules are
> stricter and gate the build (`npm run lint:boundaries`):
> - `domain/` layers are **fully isolated** — they import only `@mojo/shared/*`
>   and their own module, never another module (not even its `domain`).
> - Only `application`/`infrastructure` may import another module's `domain`
>   contract types (e.g. `discovery` → `@mojo/pricing/domain` for the rate
>   contract). Other modules' `application`/`infrastructure`/`feature` may never
>   be imported across a boundary; inter-module behaviour flows through
>   `@mojo/shared/events`.
> - The dependency tables below are the planning view. The actual code-level
>   module graph is much smaller — see `docs/uml/01-structural.md` and
>   `docs/uml/05-spec.md` for what is real in the tree.

```
Platform        notifications · admin-config · analytics
                          ↓ (mostly via events)
Trust/Engage/   trust-safety · messaging · reviews · referrals · ai-learning
Learning
                          ↓
Commerce        pricing · mojo-plus · payments · billing
                          ↓
Marketplace     discovery · scheduling · booking · lab
                          ↓
Tutor           tutor-profile · tutor-performance
                          ↓
Identity        identity  (foundation — depends on nothing else)
```

---

## Modules by domain

### Identity
| Module | Owns | Depends on |
|---|---|---|
| `identity` | Accounts, auth, sessions, role/permission checks | — |

### Tutor
| Module | Owns | Depends on |
|---|---|---|
| `tutor-profile` | Applications, profile data, subjects, moderation status | `identity` |
| `tutor-performance` | Response time, conversion rate, cancellation rate, level state — all **derived**, computed by subscribing to events, not written directly | `identity`, `tutor-profile` |

### Marketplace
| Module | Owns | Depends on |
|---|---|---|
| `discovery` | Search, filters, favorites | `tutor-profile`, `pricing` (for price bands) |
| `scheduling` | Availability rules, exceptions, group labs (open/lock/cancel, member sessions) | `identity`, `tutor-profile` |
| `booking` | Session lifecycle: book, reschedule, cancel, complete, no-show, delivery confirmation | `scheduling`, `identity` |
| `lab` | Virtual-lab session access (thin wrapper over the video SDK) | `booking` |

### Commerce
| Module | Owns | Depends on |
|---|---|---|
| `pricing` | Level → take-home %, segment rates, commission calculation, **group pricing ladder** — **pure domain logic, no I/O** | `tutor-performance` |
| `mojo-plus` | Subscription state, custom-pricing entitlement | `identity`, `pricing` |
| `payments` | Tutor wallet ledger, payout rail integration, payout approval, per-student group charges, lock true-up refunds | `booking`, `pricing`, `mojo-plus` |
| `billing` | Student payment methods, lesson-package subscriptions | `identity`, `booking`, `pricing` |

### Engagement
| Module | Owns | Depends on |
|---|---|---|
| `messaging` | Pre-booking chat | `identity` |
| `reviews` | Ratings & written reviews | `booking` |
| `referrals` | Referral links, reward tracking | `identity`, `billing` |

### Trust & safety
| Module | Owns | Depends on |
|---|---|---|
| `trust-safety` | Disputes, suspensions/appeals, content moderation, admin view-as | `identity`, `booking`, `payments` |

### Learning
| Module | Owns | Depends on |
|---|---|---|
| `ai-learning` | Post-lesson recap, daily practice, scenario drills | `booking` |

### Platform (cross-cutting)
| Module | Owns | Depends on |
|---|---|---|
| `notifications` | Email/WhatsApp dispatch, reminder scheduling | subscribes to events from nearly everything |
| `admin-config` | Taxonomy, policy config, feature flags, broadcasts, help content, audit log | reads across modules; writes only its own config tables |
| `analytics` | Platform metrics, tutor leaderboard, cohort/retention reporting | subscribes to events from nearly everything |

`pricing` being pure domain logic with no I/O is worth calling out on its own: level
percentages, segment rates, and the commission split calculation should be
plain functions of plain data — no database calls, no framework — so the entire
Phase 2 monetization model can be unit-tested without spinning up Postgres. That's
the same instinct that shaped the roadmap's "pure functions, tested separately from
the DB layer" constraint for scheduling — apply it here too.

---

## The event backbone

Cross-module reactions run on an in-process event bus (see the monorepo doc for the
mechanism), not direct calls, wherever a module needs to *react* to something
rather than *request* something. This is what lets `notifications` and `analytics`
stay decoupled from everything they observe.

| Event | Published by | Key subscribers |
|---|---|---|
| `TutorApplicationSubmitted/Approved/Rejected` | `tutor-profile` | `notifications` |
| `SessionBooked` | `booking` | `notifications`, `analytics` |
| `SessionRescheduled` / `SessionCancelled` | `booking` | `notifications`, `tutor-performance`, `analytics` |
| `SessionCompleted` | `booking` | `pricing` (charge calc), `payments` (payout eligibility), `ai-learning` (trigger recap), `tutor-performance`, `analytics` |
| `SessionNoShow` | `booking` | `tutor-performance`, `trust-safety`, `analytics` |
| `SessionDeliveryConfirmed` | `booking` | `payments` (releases the payout) |
| `TutorLevelChanged` | `tutor-performance` | `pricing`, `notifications` |
| `MojoPlusSubscribed/Cancelled` | `mojo-plus` | `pricing`, `payments`, `analytics` |
| `PayoutRequested/Completed` | `payments` | `notifications`, `admin-config` (audit log) |
| `ReviewSubmitted` | `reviews` | `tutor-performance`, `notifications` |
| `DisputeFiled/Resolved` | `trust-safety` | `notifications`, `payments` (holds/releases funds) |
| `ReferralConverted` | `referrals` | `billing`, `payments`, `notifications` |

> **[divergence]** The events actually defined in code are a subset of this table
> (and `TutorApplicationSubmitted` / `ReferralConverted` are typed and published).
> The 15-event catalog that exists is in `docs/uml/04-behavioral.md §11`;
> `SessionRescheduled`, `TutorApplicationApproved/Rejected`, and a few others above
> remain roadmap events.

Notice `tutor-performance` never gets written to directly by anything — it's built
entirely from `SessionCompleted`, `SessionCancelled`, `SessionNoShow`, and
`ReviewSubmitted` events. That's deliberate: the module that owns a tutor's ranking
and level should never trust another module's opinion about it, only the raw
events everyone agrees happened.
