# Mojo — UML Documentation Set

A formal UML model of the Mojo codebase, generated *from the code* — every diagram
here is intended to be an honest reflection of `libs/`, `apps/`, and
`prisma/schema.prisma`. Where the implementation differs from the intent in the
planning docs (`assets/mojo-*.md`), those gaps are **flagged explicitly** rather than
silently papered over.

## Documents

| # | Document | What it models |
|---|---|---|
| 01 | [structural](01-structural.md) | System structure: Nx monorepo topology, apps vs. libs, the clean-architecture layering rule, and external integrations |
| 02 | [class-diagrams](02-class-diagrams.md) | Class/interface structure: ports, concrete infra classes, use-case factories, and value objects per module |
| 03 | [data-model](03-data-model.md) | Persistence model: the consolidated Prisma entity model (ER diagram), enums, and cardinalities |
| 04 | [behavioral](04-behavioral.md) | Behavior: state machines, sequence/interaction flows, the booking activity, and the event catalog |
| 05 | [spec](05-spec.md) | Formal specification: domain invariants, dependency contract, event contract, and per-module implementation depth |

## Conventions

- **Diagrams are Mermaid**, embedded as fenced code blocks. They render on GitHub
  and anywhere that supports Mermaid, and stay diffable as plain text with the code.
- **Full-depth modules** — `identity`, `scheduling`, `pricing`, `booking`, `lab`,
  `payments`, `mojo-plus` — have use-cases, Prisma repositories, and Vitest specs.
- **Scaffold-depth modules** — the remaining twelve — have domain types and a single
  thin use-case, but no wired persistence or tests. In the diagrams they are marked
  `<<scaffold>>` so the UML never implies they are more implemented than they are.
- The **source of truth is the code**. The planning docs are cited for rationale
  only; any mismatch between a plan and the code is called out in `[divergence]`
  notes.

## Quick orientation

```
mojo/
├── apps/
│   ├── hub       # student + tutor marketplace (Next.js)
│   └── admin     # admin panel, separate trust boundary (Next.js)
├── libs/
│   ├── shared/   # ui · util · domain (Money, TimeRange) · events (EventBus)
│   └── <module>/ # one folder per bounded module, clean-architecture layers
└── prisma/       # single consolidated schema.prisma
```

Two apps, one database, ~19 domain modules behind a modular-monolith boundary.
Cross-module reactions run on an in-process event bus (`libs/shared/events`), not
direct network calls — see [04-behavioral](04-behavioral.md#11-event-catalog-as-defined-in-code) for the
exact event contracts that exist in code.
