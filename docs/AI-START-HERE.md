# AI Start Here

> Use this file as the first context file for a new AI development chat.

## What To Read First

Read in this order:

1. `docs/NBOS/00-Documentation-Hub.md`
2. `docs/NBOS/00-Implementation-Roadmap.md`
3. `docs/IMPLEMENTATION_PROGRESS.md`
4. `docs/NBOS/00-Documentation-Consistency-Audit.md`
5. The specific module docs for the task you are implementing.

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

1. Identify the module and roadmap phase.
2. Read the module canon and cleanup register.
3. Check current code behavior.
4. Implement the smallest safe slice.
5. Keep modules independent: missing linked modules must not crash the current module.
6. Never fake financial, payment, payroll, credential, audit or report data.
7. All UI work must use the existing Tailwind + shadcn/ui stack and be implemented with polished NBOS visual quality: clean spacing, clear hierarchy, responsive layout, consistent cards/forms/tables, and subtle interaction states.

## Current Development Entry Point

Start implementation from:

```text
docs/NBOS/00-Implementation-Roadmap.md
```

Then check the current progress state:

```text
docs/IMPLEMENTATION_PROGRESS.md
```

Current first phase:

```text
Phase 1 - Platform shell and foundations
```

Key rule:

```text
Build module by module.
Close behavior before adding depth.
Prefer safe incomplete workflows over broken cross-module dependencies.
```
