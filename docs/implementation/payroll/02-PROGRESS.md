# Payroll completion progress

**Updated:** 2026-09-27  
**Branch:** `feat/payroll-completion` (from `origin/main` `32f3c4ac5`, which contains `sipan` `d39e67c67`)  
**Active slice:** P1-S2  
**Next step:** Grok 4.6 High implements payment evidence, exception reasons, and the PAID boundary. Direct PAID without a payout and reasonless extra awards are still open.

## Workspace

- Working tree was clean. Payroll work is isolated on `feat/payroll-completion`, based on current `main` after `sipan` was merged.
- `TODO.md` was empty. It now points here.
- No production database, migration, or payout is in scope.
- `DATABASE_URL` has not been treated as safe. P1-S1 must not migrate or write a database. Targeted unit/guard tests only until an isolated database is identified.

## Models

| Role               | Requested            | Actually available for launch                   | Used                   |
| ------------------ | -------------------- | ----------------------------------------------- | ---------------------- |
| Orchestrator       | Grok 4.7 High        | Parent session                                  | Yes, this chat         |
| Main executor      | Grok 4.7 High        | Not listed. Substitute: Grok 4.6 High           | P1-S1 done; P1-S2 next |
| Complex analyst    | Grok 4.7 xHigh       | Listed                                          | Not used               |
| Simple executor    | Composer standard    | Composer 2.5 Fast                               | Not used               |
| Finance reviewer   | Claude Opus 5.5 High | Not listed. Same family: Claude Opus 5.5 Medium | P1-S1 review closed    |
| Alternate reviewer | GPT-5.6 Sol High     | Listed                                          | Held in reserve        |

Paid-launch log. Token cost is not invented when the session does not report it.

| When       | Task                        | Model                  | Reason                                                                            | Scope                                                               |
| ---------- | --------------------------- | ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-09-27 | P1-S1 authorization review  | Claude Opus 5.5 Medium | Opus 5.5 High is not available. One other-family review of the money-access diff. | Uncommitted payroll permission diff only                            |
| 2026-09-27 | Recheck two confirmed leaks | Claude Opus 5.5 Medium | Same reviewer, only the two money-scope defects and their tests.                  | `payroll-run-detail`, `payroll-run-access`, `bonus-release.service` |

## Slice log

| Slice | Status        | Executor          | Reviewer               | Checks                                                                                         | Commit      | Notes                                                             |
| ----- | ------------- | ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| P1-S1 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest passed; web typecheck passed; API typecheck still fails on unrelated CRM `lid` | `b06e6667e` | Department totals and payroll-run attachment rechecked and closed |
| P1-S2 | `IN_PROGRESS` | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           | PAID evidence and exception reasons                               |
| P2-S1 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P2-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P2-S3 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P3-S1 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P3-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P3-S3 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P3-S4 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           | Historical carry must survive                                     |
| P4-S1 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P4-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P4-S3 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P5-S1 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P5-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P5-S3 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           |                                                                   |
| P6-S1 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           | Blocked for live data until a separate authorization              |
| P6-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                              | —           | Needs isolated environment                                        |
| P6-S3 | `PLANNED`     | Composer 2.5 Fast | Grok 4.6 High          | —                                                                                              | —           | Canon text only, after behavior is verified                       |

## Review findings

| ID       | Status | Finding                                                                        |
| -------- | ------ | ------------------------------------------------------------------------------ |
| P1-S1-R1 | Closed | Dashboard `payrollRuns` is null unless salary VIEW is ALL.                     |
| P1-S1-R2 | Closed | KPI and bonus policy reads require ALL.                                        |
| P1-S1-R3 | Closed | Department detail totals come from scoped lines. Recheck passed.               |
| P1-S1-R4 | Closed | Attaching a release to a payroll run requires salary EDIT ALL. Recheck passed. |

## External blockers

| Blocker                                                            | Effect                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Cutover month not supplied                                         | New rules cannot be applied to real history. Synthetic tests can still proceed |
| Real salaries, KPI targets, rates, and Delivery norms not supplied | Real payroll cannot be run. Do not invent them                                 |
| Production migration and payouts forbidden                         | Launch remains unauthorized after code completion                              |
| Isolated PostgreSQL not yet identified                             | Race tests (V-13) stay open until a disposable database is confirmed           |

## M / V closure

M-01–M-11 and V-01–V-19 stay open until the slice log records evidence. Historical audit tests are not evidence for this branch.
