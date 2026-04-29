# AI Start Here

> Use this file as the first context file for a new AI development chat.

## What To Read First

Read in this order:

1. `docs/NBOS/00-Documentation-Hub.md`
2. `docs/NBOS/00-Implementation-Roadmap.md`
3. `docs/NBOS/00-Technical-Decisions-By-Module.md`
4. `docs/IMPLEMENTATION_PROGRESS.md`
5. `docs/NBOS/00-Documentation-Consistency-Audit.md`
6. The specific module docs for the task you are implementing.

## Source Of Truth

`docs/NBOS` is the active business, process and UI canon.

If documents conflict, use this priority:

1. `docs/NBOS/00-Documentation-Hub.md`
2. `docs/NBOS/00-Implementation-Roadmap.md`
3. `docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md`
4. `docs/NBOS/03-Business-Logic/*`
5. `docs/NBOS/02-Modules/*`
6. `docs/NBOS/05-UI-Specifications/*`

## What Not To Treat As Canon

- `docs/archive/*` is historical context only.
- `docs/NBOS/archive/*` is historical context only.
- Cleanup registers are implementation checklists, not active business behavior.
- Reference files under `docs/reference/*` are technical references, not product scope.

## How To Work

Before coding:

1. Identify the module and roadmap phase (see `docs/IMPLEMENTATION_PROGRESS.md` for **current** phase; do not assume Phase 1).
2. Read `docs/NBOS/00-Technical-Decisions-By-Module.md`.
3. Read the module canon and cleanup register.
4. Check current code behavior.
5. Implement the **next substantive cohesive unit** per roadmap—**large vertical slices are OK** when they match `docs/NBOS` (e.g. Plan·Card, ledger, payroll)—**avoid** polish-only micro-fragments and **avoid** unscoped refactors unrelated to the task. For **schema-wide or canon-sized** work: re-read the relevant NBOS module docs **twice** before changing code; ship in coherent increments, not scattered edits. **Git:** when the slice is done, prefer **one commit at the end** that includes **all** files touched for that slice (small or large), after the relevant checks—avoid mid-slice micro-commits unless unblocking CI or production for the same slice.
6. Keep modules independent: missing linked modules must not crash the current module.
7. Never fake financial, payment, payroll, credential, audit or report data.
8. All UI work must use the existing Tailwind + shadcn/ui stack and be implemented with polished NBOS visual quality: clean spacing, clear hierarchy, responsive layout, consistent cards/forms/tables, and subtle interaction states.

**When the user says to continue professionally / per plan** (any language): treat `docs/NBOS` + roadmap + module canon as **product agreement**—execute at **full appropriate depth** without asking permission for slice size. **Stop and ask** only for missing credentials, irresolvable doc conflicts, or off-roadmap tech pivots.

## Current Development Entry Point

Start implementation from:

```text
docs/NBOS/00-Implementation-Roadmap.md
```

Then check the current progress state:

```text
docs/IMPLEMENTATION_PROGRESS.md
```

Current phase (authoritative):

```text
See "Current Focus" and Phase tables in docs/IMPLEMENTATION_PROGRESS.md
(as of 2026-04-29: Phase 5 — Collaboration / knowledge is active; Phases 1–4 are done — see `docs/IMPLEMENTATION_PROGRESS.md`).
```

Key rules:

```text
Build module by module.
Close behavior before adding depth.
Prefer safe incomplete workflows over broken cross-module dependencies.
When continuing per plan: ship doc-aligned cohesive units at full depth—NBOS is the contract.
Prefer one end-of-slice commit bundling every related file (see step 5).
```
