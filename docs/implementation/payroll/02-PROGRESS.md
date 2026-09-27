# Payroll completion progress

**Updated:** 2026-09-28  
**Branch:** `feat/payroll-completion` (from `origin/main` `32f3c4ac5`, which contains `sipan` `d39e67c67`)  
**Active slice:** P5-S1
**Next step:** Grok 4.6 High applies a partial cash payment to remaining salary first, then to explicitly chosen bonus amounts.

Owner authorized synthetic data and browser checks on the local dev database (`ep-nameless-term`). Production host `ep-sweet-dew` stays untouched. No production migration or payout.

## Workspace

- Working tree was clean. Payroll work is isolated on `feat/payroll-completion`, based on current `main` after `sipan` was merged.
- `TODO.md` was empty. It now points here.
- No production database, migration, or payout is in scope.
- `DATABASE_URL` has not been treated as safe. P1-S1 must not migrate or write a database. Targeted unit/guard tests only until an isolated database is identified.

## Models

| Role               | Requested            | Actually available for launch                   | Used                   |
| ------------------ | -------------------- | ----------------------------------------------- | ---------------------- |
| Orchestrator       | Grok 4.7 High        | Parent session                                  | Yes, this chat         |
| Main executor      | Grok 4.7 High        | Not listed. Substitute: Grok 4.6 High           | P4-S3 done; P5-S1 next |
| Complex analyst    | Grok 4.7 xHigh       | Listed                                          | Not used               |
| Simple executor    | Composer standard    | Composer 2.5 Fast                               | Not used               |
| Finance reviewer   | Claude Opus 5.5 High | Not listed. Same family: Claude Opus 5.5 Medium | P4-S3 review closed    |
| Alternate reviewer | GPT-5.6 Sol High     | Listed                                          | Held in reserve        |

Paid-launch log. Token cost is not invented when the session does not report it.

| When       | Task                           | Model                  | Reason                                                                            | Scope                                                               |
| ---------- | ------------------------------ | ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-09-27 | P1-S1 authorization review     | Claude Opus 5.5 Medium | Opus 5.5 High is not available. One other-family review of the money-access diff. | Uncommitted payroll permission diff only                            |
| 2026-09-27 | Recheck two confirmed leaks    | Claude Opus 5.5 Medium | Same reviewer, only the two money-scope defects and their tests.                  | `payroll-run-detail`, `payroll-run-access`, `bonus-release.service` |
| 2026-09-27 | P1-S2 PAID and reasons         | Claude Opus 5.5 Medium | Money-status boundary. Opus 5.5 High is unavailable.                              | Uncommitted diff since `b06e6667e` only                             |
| 2026-09-27 | Recheck early release          | Claude Opus 5.5 Medium | Same reviewer, only the PROGRESS/EARLY reason defect.                             | Matrix write, materialize, and the reason helper                    |
| 2026-09-27 | P2-S1 salary month review      | Claude Opus 5.5 Medium | Money-period boundary. Opus 5.5 High is unavailable.                              | Uncommitted diff since `68a882727` only                             |
| 2026-09-27 | P2-S1 recheck of four findings | Claude Opus 5.5 Medium | Same reviewer, only termination, directory, gap, and past start.                  | Those four paths in the uncommitted salary diff                     |
| 2026-09-27 | P2-S2 Sales KPI review         | Claude Opus 5.5 Medium | KPI hold and factor. Opus 5.5 High is unavailable.                                | KPI files only, not the currency diff                               |
| 2026-09-27 | P2-S3 AMD currency review      | Claude Opus 5.5 Medium | Take-home currency boundary. Opus 5.5 High is unavailable.                        | Currency and expense materialization only                           |
| 2026-09-27 | P3-S1 both Sales roles review  | Claude Opus 5.5 Medium | Role persistence. Opus 5.5 High is unavailable.                                   | Uncommitted role and migration diff only                            |
| 2026-09-27 | P3-S1 recurring replay recheck | Claude Opus 5.5 Medium | Same reviewer, only the first-month rate on a later invoice.                      | Subscription routing in `sales-bonus-accrual.service`               |
| 2026-09-28 | P3-S2 qualifying invoice       | Claude Opus 5.5 Medium | Receipt rates and invoice floor. Opus 5.5 High is unavailable.                    | Uncommitted qualifying-invoice diff only                            |
| 2026-09-28 | P3-S3 order envelope review    | Claude Opus 5.5 Medium | Combined 300,000 cap. Opus 5.5 High is unavailable.                               | Uncommitted order-envelope diff only                                |
| 2026-09-28 | P3-S4 salary-ceiling review    | Claude Opus 5.5 Medium | Ceiling removal and consumed carry. Opus 5.5 High is unavailable.                 | Uncommitted ceiling and carry diff only                             |
| 2026-09-28 | P4-S1 matrix source sum        | Claude Opus 5.5 Medium | Cell total of every visible entry. Opus 5.5 High is unavailable.                  | Uncommitted matrix source diff only                                 |
| 2026-09-28 | P4-S2 plan parts and extra     | Claude Opus 5.5 Medium | Installments, extra overflow, and title splits. Opus 5.5 High is unavailable.     | Uncommitted installment and extra diff only                         |
| 2026-09-28 | P4-S3 older unpaid bonus       | Claude Opus 5.5 Medium | Month eligibility and settlement currency. Opus 5.5 High is unavailable.          | Uncommitted older-unpaid diff only                                  |

## Slice log

| Slice | Status        | Executor          | Reviewer               | Checks                                                                                                      | Commit      | Notes                                                                                                       |
| ----- | ------------- | ----------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| P1-S1 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest passed; web typecheck passed; API typecheck still fails on unrelated CRM `lid`              | `b06e6667e` | Department totals and payroll-run attachment rechecked and closed                                           |
| P1-S2 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest passed. API typecheck not obtained (OOM). No browser.                                       | `b1664e362` | Early recheck closed. Direct PAID rejected. Exception reasons required.                                     |
| P2-S1 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 10 files, 60 passed. No browser. No PostgreSQL race. Recheck closed four findings.          | `cb48c47bf` | Directory 409 if legacy overlaps is display-only                                                            |
| P2-S2 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest on the cap passed. No browser. Stacked-release recheck closed.                              | `b616e9b9a` | Missing plan holds. Ordinary releases cannot exceed payable.                                                |
| P2-S3 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 32 passed. No browser.                                                             | `2ea6c9c2f` | USD/EUR/blank rejected at seed and approval. No FX.                                                         |
| P3-S1 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 5 files, 21 passed. No browser. Migration not applied. Recheck closed the recurring replay. | `73c7b493b` | Both slotted roles persist. Recurring same-person share waits for the subscription envelope                 |
| P3-S2 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest on rates and the floor. No browser. Migration `20260928010000` not applied.                 | `edfcabfcb` | Receipt rates stay put. Historical replay removed. Two low residuals remain.                                |
| P3-S3 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 25 passed. No browser. No live race. Migration `20260928020000` not applied.       | `5588995d7` | One order stays within 300,000. Recheck closed four over-cap findings.                                      |
| P3-S4 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 6 files, 41 passed. No browser. No migration.                                               | `aaf7511cc` | Full bonus is included. Open reversal returns consumed carry. Closed or PAID April stays an owner decision. |
| P4-S1 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 3 files, 21 passed. No browser. No migration.                                               | `5299c4022` | Planned cell amount is the sum of visible sources. Both entry ids stay on the cell.                         |
| P4-S2 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 3 files, 23 passed on the last recheck. No browser. No migration.                           | `3f917cce6` | Plan parts stay on the plan. Extra is only the amount above every source remainder.                         |
| P4-S3 | `VERIFIED`    | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 28 passed on the last recheck. No browser. No migration.                           | `637dd783f` | August 40,000 stays payable in October. A zero-salary settlement approves as AMD.                           |
| P5-S1 | `IN_PROGRESS` | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                                           | —           | Partial cash pays remaining salary first. Bonus cash is explicitly assigned.                                |
| P5-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                                           | —           |                                                                                                             |
| P5-S3 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                                           | —           |                                                                                                             |
| P6-S1 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                                           | —           | Blocked for live data until a separate authorization                                                        |
| P6-S2 | `PLANNED`     | Grok 4.6 High     | Claude Opus 5.5 Medium | —                                                                                                           | —           | Needs isolated environment                                                                                  |
| P6-S3 | `PLANNED`     | Composer 2.5 Fast | Grok 4.6 High          | —                                                                                                           | —           | Canon text only, after behavior is verified                                                                 |

## Review findings

| ID       | Status | Finding                                                                                                                             |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| P1-S1-R1 | Closed | Dashboard `payrollRuns` is null unless salary VIEW is ALL.                                                                          |
| P1-S1-R2 | Closed | KPI and bonus policy reads require ALL.                                                                                             |
| P1-S1-R3 | Closed | Department detail totals come from scoped lines. Recheck passed.                                                                    |
| P1-S1-R4 | Closed | Attaching a release to a payroll run requires salary EDIT ALL. Recheck passed.                                                      |
| P1-S2-R1 | Closed | Non-sales PROGRESS requires a reason and materializes as EARLY. Sales PROGRESS stays ordinary. Recheck passed.                      |
| P2-S1-R1 | Closed | Terminated pay stops after the fireDate month. Open-ended profile does not continue. Recheck passed.                                |
| P2-S1-R2 | Closed | Directory returns only the profile covering the current month. Recheck passed.                                                      |
| P2-S1-R3 | Closed | A later profile no longer hides a gap when earlier terms exist. Recheck passed.                                                     |
| P2-S1-R4 | Closed | A past start month cannot be activated and does not shorten the current profile. Recheck passed.                                    |
| P3-S1-R1 | Closed | A later subscription invoice no longer receives the first-month rate. Recheck passed.                                               |
| P3-S1-R2 | Closed | Recurring roles use `sales_accrual_role`, so equal percents keep both shares.                                                       |
| P3-S2-R1 | Closed | A later rate version does not reprice an older receipt. Recheck passed.                                                             |
| P3-S2-R2 | Closed | Publishing a rate does not replay historical invoices. Recheck passed.                                                              |
| P3-S2-R3 | Closed | Marking an invoice paid runs accrual once. Recheck passed.                                                                          |
| P3-S2-R4 | Closed | A below-minimum sibling does not turn the creation floor off. Recheck passed.                                                       |
| P3-S2-R5 | Closed | Reactivating the current closed version covers later receipts. Recheck passed.                                                      |
| P3-S2-R6 | Closed | Inactive legacy rows get a zero-length window in the unapplied migration. Recheck passed.                                           |
| P3-S2-R7 | Closed | Reactivating an older id while a newer version is open is rejected. Recheck passed. The later receipt stays 120,000.                |
| P3-S2-R8 | Open   | Two reactivations at the same instant can insert two open versions. Low. No partial unique index.                                   |
| P3-S2-R9 | Open   | A percent edit on an old closed row copies the unsent percent from that old row. Low.                                               |
| P3-S3-R1 | Closed | Null invoice ids count toward the 300,000 sum. Recheck passed.                                                                      |
| P3-S3-R2 | Closed | A legacy null-role row blocks a second insert for that employee. Recheck passed.                                                    |
| P3-S3-R3 | Closed | The order lock covers the sum and the inserts. Recheck passed. No live Postgres race.                                               |
| P3-S3-R4 | Closed | A replay cannot refill a spent envelope. Recheck passed.                                                                            |
| P3-S3-R5 | Open   | A partial wave from before this change can replay the missing role at 12,000 instead of 60,000. Low. Under 300,000.                 |
| P3-S4-R1 | Closed | Reversing May finds April after a June re-attach and returns 100,000. Recheck passed.                                               |
| P3-S4-R2 | Open   | If April is on a closed or PAID run, reversing May removes 100,000 with no destination. Owner decision.                             |
| P3-S4-R3 | Open   | Restore credits the newest remembered carry, not the release that month consumed. Low. Employee total stays put.                    |
| P4-S1-R1 | Closed | Two visible entries of 50 and 70 display 120. Review passed.                                                                        |
| P4-S1-R2 | Closed | A chosen 50 and 30 split materializes on those sources. A bare 80 is still rejected.                                                |
| P4-S2-R1 | Closed | Extra consumes every visible source remainder, then extras only the excess. Recheck passed.                                         |
| P4-S2-R3 | Open   | If one source was released past its plan, the matrix net and the per-source sum can disagree. 10 may be paid twice. Low. Unsettled. |
| P4-S3-R1 | Closed | A zero-salary settlement with no profile approves as AMD. Blank, USD, and EUR salary lines stay rejected. Recheck passed.           |
| P4-S3-R2 | Open   | The approval test mocks attach, so line creation and a single include are shown by reading the code. Low.                           |
| P4-S2-R2 | Closed | A manual title with the source-amount prefix does not pay another employee's plan. Recheck passed.                                  |

## External blockers

| Blocker                                                            | Effect                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Cutover month not supplied                                         | New rules cannot be applied to real history. Synthetic tests can still proceed |
| Real salaries, KPI targets, rates, and Delivery norms not supplied | Real payroll cannot be run. Do not invent them                                 |
| Production migration and payouts forbidden                         | Launch remains unauthorized after code completion                              |
| Dev host known; migration `20260927233000` not applied             | Race tests stay open. Do not write production host `ep-sweet-dew`              |

## M / V closure

M-01–M-11 and V-01–V-19 stay open until the slice log records evidence. Historical audit tests are not evidence for this branch.
