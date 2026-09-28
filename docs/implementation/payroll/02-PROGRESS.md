# Payroll completion progress

**Updated:** 2026-09-28  
**Branch:** `feat/payroll-completion` (from `origin/main` `32f3c4ac5`, which contains `sipan` `d39e67c67`)  
**Active slice:** none
**Next step:** The uncommitted money diff was reviewed on 2026-09-28 by Claude Opus 5.5 Medium (Opus 5.5 High is not listed). Two confirmed defects were fixed and retested: a multi-source cell no longer drops a saved release on blur, and bonus auto-release no longer calls `$transaction` inside the payment transaction. Wallet notices flush only after that transaction commits. Browser V-01–V-19, the unpaid TAX_FREE 210,000 card, and the real cutover month stay open. Do not write production. This branch is not production-ready.

Owner authorized synthetic data and browser checks on the local dev database (`ep-nameless-term`). Production host `ep-sweet-dew` stays untouched. No production migration or payout.

Dev schema rechecked 2026-09-28 on `ep-nameless-term` only. Applied there: `20260926200000`, `20260927190000`, `20260927233000`, `20260928010000`, `20260928020000`, and `20260928030000` (one open Sales policy version per category and payment model). No duplicate open rows were present. Slice rows that say a migration was not applied describe that earlier commit, not this database. Production was not migrated.

## Workspace

- Working tree was clean. Payroll work is isolated on `feat/payroll-completion`, based on current `main` after `sipan` was merged.
- `TODO.md` was empty. It now points here.
- No production database, migration, or payout is in scope.
- `DATABASE_URL` has not been treated as safe. P1-S1 must not migrate or write a database. Targeted unit/guard tests only until an isolated database is identified.

## Models

| Role               | Requested            | Actually available for launch                   | Used                                  |
| ------------------ | -------------------- | ----------------------------------------------- | ------------------------------------- |
| Orchestrator       | Grok 4.7 High        | Parent session                                  | Yes, this chat                        |
| Main executor      | Grok 4.7 High        | Not listed. Substitute: Grok 4.6 High           | P6-S2 amounts committed; browser next |
| Complex analyst    | Grok 4.7 xHigh       | Listed                                          | Not used                              |
| Simple executor    | Composer standard    | Composer 2.5 Fast                               | Not used                              |
| Finance reviewer   | Claude Opus 5.5 High | Not listed. Same family: Claude Opus 5.5 Medium | P6-S1 review closed                   |
| Alternate reviewer | GPT-5.6 Sol High     | Listed                                          | Held in reserve                       |

Paid-launch log. Token cost is not invented when the session does not report it.

| When       | Task                           | Model                  | Reason                                                                              | Scope                                                               |
| ---------- | ------------------------------ | ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2026-09-27 | P1-S1 authorization review     | Claude Opus 5.5 Medium | Opus 5.5 High is not available. One other-family review of the money-access diff.   | Uncommitted payroll permission diff only                            |
| 2026-09-27 | Recheck two confirmed leaks    | Claude Opus 5.5 Medium | Same reviewer, only the two money-scope defects and their tests.                    | `payroll-run-detail`, `payroll-run-access`, `bonus-release.service` |
| 2026-09-27 | P1-S2 PAID and reasons         | Claude Opus 5.5 Medium | Money-status boundary. Opus 5.5 High is unavailable.                                | Uncommitted diff since `b06e6667e` only                             |
| 2026-09-27 | Recheck early release          | Claude Opus 5.5 Medium | Same reviewer, only the PROGRESS/EARLY reason defect.                               | Matrix write, materialize, and the reason helper                    |
| 2026-09-27 | P2-S1 salary month review      | Claude Opus 5.5 Medium | Money-period boundary. Opus 5.5 High is unavailable.                                | Uncommitted diff since `68a882727` only                             |
| 2026-09-27 | P2-S1 recheck of four findings | Claude Opus 5.5 Medium | Same reviewer, only termination, directory, gap, and past start.                    | Those four paths in the uncommitted salary diff                     |
| 2026-09-27 | P2-S2 Sales KPI review         | Claude Opus 5.5 Medium | KPI hold and factor. Opus 5.5 High is unavailable.                                  | KPI files only, not the currency diff                               |
| 2026-09-27 | P2-S3 AMD currency review      | Claude Opus 5.5 Medium | Take-home currency boundary. Opus 5.5 High is unavailable.                          | Currency and expense materialization only                           |
| 2026-09-27 | P3-S1 both Sales roles review  | Claude Opus 5.5 Medium | Role persistence. Opus 5.5 High is unavailable.                                     | Uncommitted role and migration diff only                            |
| 2026-09-27 | P3-S1 recurring replay recheck | Claude Opus 5.5 Medium | Same reviewer, only the first-month rate on a later invoice.                        | Subscription routing in `sales-bonus-accrual.service`               |
| 2026-09-28 | P3-S2 qualifying invoice       | Claude Opus 5.5 Medium | Receipt rates and invoice floor. Opus 5.5 High is unavailable.                      | Uncommitted qualifying-invoice diff only                            |
| 2026-09-28 | P3-S3 order envelope review    | Claude Opus 5.5 Medium | Combined 300,000 cap. Opus 5.5 High is unavailable.                                 | Uncommitted order-envelope diff only                                |
| 2026-09-28 | P3-S4 salary-ceiling review    | Claude Opus 5.5 Medium | Ceiling removal and consumed carry. Opus 5.5 High is unavailable.                   | Uncommitted ceiling and carry diff only                             |
| 2026-09-28 | P4-S1 matrix source sum        | Claude Opus 5.5 Medium | Cell total of every visible entry. Opus 5.5 High is unavailable.                    | Uncommitted matrix source diff only                                 |
| 2026-09-28 | P4-S2 plan parts and extra     | Claude Opus 5.5 Medium | Installments, extra overflow, and title splits. Opus 5.5 High is unavailable.       | Uncommitted installment and extra diff only                         |
| 2026-09-28 | P4-S3 older unpaid bonus       | Claude Opus 5.5 Medium | Month eligibility and settlement currency. Opus 5.5 High is unavailable.            | Uncommitted older-unpaid diff only                                  |
| 2026-09-28 | P5-S1 salary-first cash        | Claude Opus 5.5 Medium | Salary before named bonus cash. Opus 5.5 High is unavailable.                       | Uncommitted salary-first cash diff only                             |
| 2026-09-28 | P5-S2 payment reversal         | Claude Opus 5.5 Medium | Original links on delete and refund. Opus 5.5 High is unavailable.                  | Uncommitted reversal diff only                                      |
| 2026-09-28 | P5-S2 refund id recheck        | Claude Opus 5.5 Medium | Same reviewer, only the missing payment id and the closed-run write.                | Salary-line sync, refund, and the select-honouring mock             |
| 2026-09-28 | P5-S3 register reconciliation  | Claude Opus 5.5 Medium | Wallet, journal, and salary line on one payment. Opus 5.5 High is unavailable.      | Uncommitted register diff only                                      |
| 2026-09-28 | P5-S3 delete journal recheck   | Claude Opus 5.5 Medium | Same reviewer, only the leftover journal after payment delete.                      | Delete, refund neutralize, and journal reverse                      |
| 2026-09-28 | P6-S1 unpaid inventory         | Claude Opus 5.5 Medium | Read-only old balances. Opus 5.5 High is unavailable.                               | Uncommitted inventory diff only                                     |
| 2026-09-28 | P6-S1 double-count recheck     | Claude Opus 5.5 Medium | Same reviewer, included remaining, consumed carry, KPI burn, and carry twice.       | Inventory remaining helpers                                         |
| 2026-09-28 | P6-S2 independent amounts      | Claude Opus 5.5 Medium | Expected amounts vs implementation. Opus 5.5 High is unavailable.                   | Uncommitted P6-S2 expected files only                               |
| 2026-09-28 | P6-S2 invoice PAID recheck     | Claude Opus 5.5 Medium | Same reviewer, status from receipts and createMany 16,800 / 4,200.                  | Invoice test and expected split                                     |
| 2026-09-28 | V-13 order envelope race       | Claude Opus 5.5 Medium | Concurrent cap on one order. Opus 5.5 High is unavailable.                          | Race test and fixture only                                          |
| 2026-09-28 | Money-diff review              | Claude Opus 5.5 Medium | Opus 5.5 High is not listed. One other-family review of the uncommitted money diff. | Uncommitted payroll money diff only                                 |

## Slice log

| Slice | Status                     | Executor          | Reviewer               | Checks                                                                                                                                                                             | Commit      | Notes                                                                                                                      |
| ----- | -------------------------- | ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| P1-S1 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest passed; web typecheck passed; API typecheck still fails on unrelated CRM `lid`                                                                                     | `b06e6667e` | Department totals and payroll-run attachment rechecked and closed                                                          |
| P1-S2 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest passed. API typecheck not obtained (OOM). No browser.                                                                                                              | `b1664e362` | Early recheck closed. Direct PAID rejected. Exception reasons required.                                                    |
| P2-S1 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 10 files, 60 passed. No browser. No PostgreSQL race. Recheck closed four findings.                                                                                 | `cb48c47bf` | Directory 409 if legacy overlaps is display-only                                                                           |
| P2-S2 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest on the cap passed. No browser. Stacked-release recheck closed.                                                                                                     | `b616e9b9a` | Missing plan holds. Ordinary releases cannot exceed payable.                                                               |
| P2-S3 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 32 passed. No browser.                                                                                                                                    | `2ea6c9c2f` | USD/EUR/blank rejected at seed and approval. No FX.                                                                        |
| P3-S1 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 5 files, 21 passed. No browser. Migration not applied. Recheck closed the recurring replay.                                                                        | `73c7b493b` | Both slotted roles persist. Recurring same-person share waits for the subscription envelope                                |
| P3-S2 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest on rates and the floor. No browser. Migration `20260928010000` not applied.                                                                                        | `edfcabfcb` | Receipt rates stay put. Historical replay removed. Two low residuals remain.                                               |
| P3-S3 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 25 passed. No browser. No live race. Migration `20260928020000` not applied.                                                                              | `5588995d7` | One order stays within 300,000. Recheck closed four over-cap findings.                                                     |
| P3-S4 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 6 files, 41 passed. No browser. No migration.                                                                                                                      | `aaf7511cc` | Full bonus is included. Open reversal returns consumed carry. Closed or PAID April stays an owner decision.                |
| P4-S1 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 3 files, 21 passed. No browser. No migration.                                                                                                                      | `5299c4022` | Planned cell amount is the sum of visible sources. Both entry ids stay on the cell.                                        |
| P4-S2 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 3 files, 23 passed on the last recheck. No browser. No migration.                                                                                                  | `3f917cce6` | Plan parts stay on the plan. Extra is only the amount above every source remainder.                                        |
| P4-S3 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 28 passed on the last recheck. No browser. No migration.                                                                                                  | `637dd783f` | August 40,000 stays payable in October. A zero-salary settlement approves as AMD.                                          |
| P5-S1 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 3 files, 21 passed on the last recheck. No browser. No migration.                                                                                                  | `598eef803` | Salary is paid first. Bonus cash follows the named bonus. Line carry can be paid.                                          |
| P5-S2 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 6 files, 38 passed. No browser. No migration. Recheck closed the id miss and the closed write.                                                                     | `71e1d9e49` | Refund of 50,000 leaves paidAmount 300,000. Paying A again stores 320,000. Closed run rejects the write.                   |
| P5-S3 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 4 files, 28 passed. No browser. No migration. Recheck closed the leftover journal.                                                                                 | `8e285fd1c` | After 320,000 cash wallet paid is 20,000. Delete reverses the journal to 0.                                                |
| P6-S1 | `VERIFIED`                 | Grok 4.6 High     | Claude Opus 5.5 Medium | Targeted vitest 1 file, 13 passed. No browser. No migration. Recheck closed double counts.                                                                                         | `a9d6e8991` | Each unpaid amount is listed once. A 200,000 split with 70,000 carry owes 170,000.                                         |
| P6-S2 | `IMPLEMENTED_NOT_VERIFIED` | Grok 4.6 High     | Claude Opus 5.5 Medium | Dev browser: September 2026 draft, 19 lines, payable 2,060,000 AMD, paid 0. TAX_FREE invoice DEV-FREE-210000 is New, paid 0. Order-envelope race stored 300,000.00 and cleaned up. | `a80b52061` | Payout, release, and approval races are not run. The 210,000 card has no receipts, so live 16,800 / 4,200 was not accrued. |
| P6-S3 | `VERIFIED`                 | Composer 2.5 Fast | Orchestrator           | Canon diff checked against document 11 §0, §6, and Q-39–Q-46. No app code.                                                                                                         | —           | Salary-linked monthly cap and whole-Probation KPI are historical. The half-bonus band is ≥50% and <70%.                    |

## Review findings

| ID       | Status | Finding                                                                                                                                                       |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-S1-R1 | Closed | Dashboard `payrollRuns` is null unless salary VIEW is ALL.                                                                                                    |
| P1-S1-R2 | Closed | KPI and bonus policy reads require ALL.                                                                                                                       |
| P1-S1-R3 | Closed | Department detail totals come from scoped lines. Recheck passed.                                                                                              |
| P1-S1-R4 | Closed | Attaching a release to a payroll run requires salary EDIT ALL. Recheck passed.                                                                                |
| P1-S2-R1 | Closed | Non-sales PROGRESS requires a reason and materializes as EARLY. Sales PROGRESS stays ordinary. Recheck passed.                                                |
| P2-S1-R1 | Closed | Terminated pay stops after the fireDate month. Open-ended profile does not continue. Recheck passed.                                                          |
| P2-S1-R2 | Closed | Directory returns only the profile covering the current month. Recheck passed.                                                                                |
| P2-S1-R3 | Closed | A later profile no longer hides a gap when earlier terms exist. Recheck passed.                                                                               |
| P2-S1-R4 | Closed | A past start month cannot be activated and does not shorten the current profile. Recheck passed.                                                              |
| P3-S1-R1 | Closed | A later subscription invoice no longer receives the first-month rate. Recheck passed.                                                                         |
| P3-S1-R2 | Closed | Recurring roles use `sales_accrual_role`, so equal percents keep both shares.                                                                                 |
| P3-S2-R1 | Closed | A later rate version does not reprice an older receipt. Recheck passed.                                                                                       |
| P3-S2-R2 | Closed | Publishing a rate does not replay historical invoices. Recheck passed.                                                                                        |
| P3-S2-R3 | Closed | Marking an invoice paid runs accrual once. Recheck passed.                                                                                                    |
| P3-S2-R4 | Closed | A below-minimum sibling does not turn the creation floor off. Recheck passed.                                                                                 |
| P3-S2-R5 | Closed | Reactivating the current closed version covers later receipts. Recheck passed.                                                                                |
| P3-S2-R6 | Closed | Inactive legacy rows get a zero-length window in the unapplied migration. Recheck passed.                                                                     |
| P3-S2-R7 | Closed | Reactivating an older id while a newer version is open is rejected. Recheck passed. The later receipt stays 120,000.                                          |
| P3-S2-R8 | Closed | Open versions of one key are locked and backed by `sales_bonus_policies_one_open_per_key` on dev. A live empty-open race was not re-run.                      |
| P3-S2-R9 | Closed | A percent omitted on a closed row is filled from the open version. Review passed.                                                                             |
| P3-S3-R1 | Closed | Null invoice ids count toward the 300,000 sum. Recheck passed.                                                                                                |
| P3-S3-R2 | Closed | A legacy null-role row blocks a second insert for that employee. Recheck passed.                                                                              |
| P3-S3-R3 | Closed | The order lock covers the sum and the inserts. Recheck passed. No live Postgres race.                                                                         |
| P3-S3-R4 | Closed | A replay cannot refill a spent envelope. Recheck passed.                                                                                                      |
| P3-S3-R5 | Closed | A missing role receives the smaller of the leftover envelope and its uncapped share. The 240,000 example leaves 60,000, not 12,000. Review passed.            |
| P3-S4-R1 | Closed | Reversing May finds April after a June re-attach and returns 100,000. Recheck passed.                                                                         |
| P3-S4-R2 | Closed | Reversal refuses when consumed carry cannot be restored onto a closed or PAID April. The applied amount stays. Review passed.                                 |
| P3-S4-R3 | Closed | Restore follows payroll month, oldest first. A chain where June restores carry still applied to May was not proven.                                           |
| P4-S1-R1 | Closed | Two visible entries of 50 and 70 display 120. Review passed.                                                                                                  |
| P4-S1-R2 | Closed | A chosen 50 and 30 split materializes on those sources. A bare 80 is still rejected.                                                                          |
| P4-S2-R1 | Closed | Extra consumes every visible source remainder, then extras only the excess. Recheck passed.                                                                   |
| P4-S2-R3 | Closed | Extra is only the amount above the sum of source remainders. A source that still has remainder is not paid again as extra. Review passed.                     |
| P4-S3-R1 | Closed | A zero-salary settlement with no profile approves as AMD. Blank, USD, and EUR salary lines stay rejected. Recheck passed.                                     |
| P4-S3-R2 | Open   | The approval test mocks attach, so line creation and a single include are shown by reading the code. Low.                                                     |
| P5-S1-R1 | Closed | A 430,000 payment covers 300,000 salary, 100,000 named bonus, and 30,000 line carry. Recheck passed.                                                          |
| P5-S1-R2 | Closed | Unnamed cash after salary is rejected. Carry is applied only when the financier types that carry amount. The 430,000 named path still carries 30,000.         |
| P5-S2-R1 | Closed | Salary sync loads payment id, so the 50,000 refund stores paidAmount 300,000 and A is unpaid again. Recheck passed.                                           |
| P5-S2-R2 | Closed | A second refund does not restore A again. Deleting the source payment clears the leftover refund. Recheck passed.                                             |
| P5-S2-R3 | Closed | A CLOSED run rejects the refund before insert. The closed expense paid total stays 320,000. Recheck passed.                                                   |
| P5-S2-R4 | Closed | Refund re-checks closed history inside the expense, salary-line, and payroll-run locks. Review passed.                                                        |
| P5-S3-R1 | Closed | Delete of 320,000 reverses the journal line. Refund then delete reverses both lines. ACTIVE journal nets to 0. Recheck passed.                                |
| P5-S3-R2 | Closed | Create and delete keep the payment, status, salary line, and journal in one transaction. Auto-release writes on that same client. Notices flush after commit. |
| P5-S3-R3 | Open   | The P5-S3 tests use a fake journal, not OperationalJournalService against a database. Low.                                                                    |
| P6-S1-R1 | Closed | Included remaining 40,000 of 60,000 is listed once. Recheck passed.                                                                                           |
| P6-S1-R2 | Closed | Untouched carry 100,000 is leftover only, not also an unpaid bonus. Recheck passed.                                                                           |
| P6-S1-R3 | Closed | Used carry is not an unpaid bonus. 60,000 used leaves leftover 40,000. Recheck passed.                                                                        |
| P6-S1-R4 | Closed | Entry 80,000 with included 60,000 and cash 20,000 owes 40,000. Burned 20,000 is not unpaid. Recheck passed.                                                   |
| P6-S1-R5 | Closed | Entry 200,000 with leftover carry 70,000 and unreleased 100,000 owes 170,000. Recheck passed.                                                                 |
| P6-S1-R6 | Open   | Unpaid salary remaining is not listed. Low. Required bonus and carry amounts still hold.                                                                      |
| P6-S1-R7 | Open   | findMany reads every payment, salary line, and bonus. A later HTTP route would need payroll-level scope. Low.                                                 |
| P6-S2-R1 | Closed | After 100,000 and 200,000 the derived status is not PAID. After 10,000 it is PAID and createMany is 16,800 / 4,200. Recheck passed.                           |
| P6-S2-R2 | Closed | PaymentsService.create skips onInvoicePaid after 100,000 and 200,000. The final 10,000 calls it once after the re-read is PAID.                               |
| P6-S2-R3 | Closed | Two concurrent accruals on one synthetic order stored 300,000.00. Replaying the invoice did not add a second pair. Cleanup left 0 rows. Review passed.        |
| P4-S2-R2 | Closed | A manual title with the source-amount prefix does not pay another employee's plan. Recheck passed.                                                            |
| P4-S1-R3 | Closed | Focusing a saved multi-source cell and leaving it does not send a zero release. Drafts start from each source's included amount. Unit test only.              |

## External blockers

| Blocker                                                            | Effect                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Cutover month not supplied                                         | New rules cannot be applied to real history. Synthetic tests can still proceed             |
| Real salaries, KPI targets, rates, and Delivery norms not supplied | Real payroll cannot be run. Do not invent them                                             |
| Production migration and payouts forbidden                         | Launch remains unauthorized after code completion                                          |
| Dev host known. Order-envelope race ran there and cleaned up.      | Payout, release, and approval races stay open. Do not write production host `ep-sweet-dew` |

## M / V closure

M-01–M-11 and V-01–V-19 stay open until the slice log records evidence. Historical audit tests are not evidence for this branch.
