# Repository guidance

This repository is **NBOS** — a Size C production monorepo. Keep product canon and Agent-system concerns separate.

## Before substantial work

1. Read the explicit user task and preserve its scope.
2. Read `docs/TECH_CARD.md` when it is relevant.
3. Read `docs/01-ARCHITECTURE.md` when it is relevant.
4. For product behavior, follow [`docs/NBOS/00-Documentation-Hub.md`](docs/NBOS/00-Documentation-Hub.md) and the matching module canon. Do not invent behavior from code alone when canon exists.
5. Preserve the existing architecture and approved project decisions.

## Instruction locations

```text
Product canon
→ docs/NBOS/

Approved stack and services
→ docs/TECH_CARD.md

Cursor coding standards
→ .cursor/rules/

Reusable workflows
→ .agents/skills/

Skill catalog and profiles
→ .agents/catalog/

Agent-system documentation
→ .agents/system/
```

Use the applicable Rule or Skill instead of copying its full content into this file.

NBOS is already initialized (Size C). Do not run [`project-onboarding`](.agents/skills/project-onboarding/SKILL.md) during ordinary development.

## Decision precedence

```text
explicit approved task
→ docs/NBOS module canon + implementation roadmap
→ approved TECH_CARD
→ existing project implementation
→ template recommendation
→ generic fallback
```

Preserve the existing implementation unless the approved task, TECH_CARD, or NBOS canon explicitly requires a change.

## Working boundaries

- Do not change architecture, stack, public APIs, database schema, or business behavior outside the approved task or documented NBOS roadmap scope.
- Do not perform production deployment.
- Do not perform production database migrations.
- Do not delete data.
- Do not commit or push without an explicit request.
- Do not hide or bypass test, lint, build, or validation failures.
- Do not weaken security controls to make a check pass.
- Preserve unrelated user changes and keep edits scoped.
- After meaningful changes, run project-appropriate validation and use [`.agents/skills/verify-before-completion/`](.agents/skills/verify-before-completion/).

For auth, payments, tenants, webhooks, or other security-sensitive changes, use [`.agents/skills/security-review/`](.agents/skills/security-review/). For PR/diff review, use [`.agents/skills/code-review/`](.agents/skills/code-review/).

Report checks that were not run and any remaining uncertainty instead of claiming unsupported success.
