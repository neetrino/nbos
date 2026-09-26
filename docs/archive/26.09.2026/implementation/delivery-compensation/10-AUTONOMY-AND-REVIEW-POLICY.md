# 10. Autonomy and review policy

Owner delegation, 2026-09-20: finish the remaining delivery-compensation work without per-step approval.
Decide open questions from the documented base (`docs/NBOS` canon, `07-OWNER-DISCUSSION.md`,
`08-CONSTRUCTOR-AND-SIZING.md`, `09-CATALOG-DRAFT.md`, this implementation folder) and record the
decisions instead of waiting. This file is the standing process contract for that run.

## 1. What the executor decides alone

- Naming, file layout, component split, internal refactors.
- Anything already implied by the module canon, the roadmap, or a decision recorded in `07`/`08`/`09`.
- Validation rules, error codes, blockers and UI states that follow an existing pattern in the codebase.
- Test scope per slice.

## 2. What still stops and waits for the Owner

- Production deployment and production database migrations.
- Credentials the executor does not have.
- A contradiction between canon documents with no resolution path in the documents themselves.
- Changing an already published money rule (rates, units, sale rate) rather than implementing it.

Items of this kind are collected in `12-AUTONOMOUS-DECISIONS.md` at the end of the run, shortest form:
question, what was assumed, what the Owner must confirm.

## 3. Review policy (token-aware)

The goal is a clean project, not maximum review volume. Reviews are scoped to the diff of the slice,
never to the whole repository, and a different model family reviews the executor's own work so that
family-specific blind spots are caught.

| Slice type                                                        | Review                                                                       |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Money math, payroll, permissions, lifecycle gates, DB write paths | One cross-family reviewer on the slice diff, findings fixed before moving on |
| Pure UI, copy, i18n, docs                                         | No external reviewer: typecheck, lint, prettier, tests only                  |
| Implementation delegated to a subagent                            | Executor reviews the returned diff itself (no second reviewer)               |
| Final gate before handoff                                         | One whole-branch bug review plus one security review                         |

Rules that keep the cost bounded:

- At most one reviewer per slice. No reviewer on code that did not change.
- Reviewer families rotate between runs (GPT ↔ Grok) so the reviewer is never the author's family.
- A reviewer receives the file list and the intent, and returns findings only — the executor applies fixes.
- Reviewer findings are triaged: correctness and security first, style opinions dropped when they
  contradict the repository rules.

## 4. Verification gate per slice

Every slice ends with, at minimum:

- Prettier on touched files, ESLint on touched files.
- Typecheck of each affected package.
- The narrowest meaningful test set for the touched modules, plus new tests for new logic.

No slice is reported as done on the strength of files existing. Runtime checks that were not possible
(browser flow, live database, production behavior) are named as not run rather than implied.

## 5. Database boundary for this run

Schema work stays additive and stops at the migration file. No `migrate`, `push` or `reset` against the
configured Neon hosts, including the development one, and no data deletion. Anything that needs a real
database run is written down for the Owner with the exact command.
