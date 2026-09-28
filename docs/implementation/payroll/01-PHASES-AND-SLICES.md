# Payroll phases and slices

**Branch:** `feat/payroll-completion`  
**Decision source:** [11-FINAL-COMPLETION-PLAN.md](../../audit/payroll/11-FINAL-COMPLETION-PLAN.md) sections 0, 6, and Q-39–Q-46.  
**Status values:** `PLANNED` | `IN_PROGRESS` | `IMPLEMENTED_NOT_VERIFIED` | `IN_REVIEW` | `VERIFIED` | `BLOCKED`

Concurrency and replay (M-09) are required on every slice that writes money, not only at the end. One verified slice is one local commit. Do not mark a slice `VERIFIED` while a required check is failing or a material review finding is open.

Real cutover month, salaries, KPI targets, and Delivery norms stay external inputs. Synthetic fixtures only.

## Model substitution (2026-09-27)

Requested Grok 4.7 High is not in the Cursor subagent model list. Main financial implementation uses **Grok 4.6 High** (`cursor-grok-4.6-high`). Complex diagnosis uses **Grok 4.7 xHigh** only after two failed High attempts or for migrations, races, and ledger repair. Simple UI, copy, and fixtures use **Composer 2.5 Fast**. Financial review prefers Claude Opus 5.5 High, which is unavailable; the available same-family reviewer is **Claude Opus 5.5 Medium** (`claude-opus-5-5-medium`). GPT-5.6 Sol High stays the unused alternate so only one paid family reviews a slice.

Custom role files live in `.cursor/agents/`. This session launches them through the Task tool with an explicit `model`. A launch counts as that model only when Cursor accepts the slug.

## Phase order

| Phase | Outcome for Finance                                                                                                                                               | M                | V                            | Depends on                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------- | -------------------------------------------- |
| P1    | Unauthorized people cannot see or change pay; the approver is the signed-in person; a paid record needs payment evidence; exceptions need a reason                | M-01, M-08       | V-12, V-15                   | —                                            |
| P2    | Chosen month controls full salary and individual KPI; missing terms are not zero; Probation without salary is explicit; amounts are AMD take-home                 | M-02, M-03       | V-01, V-02, V-03, V-08, V-16 | P1                                           |
| P3    | Both Sales roles survive; the first qualifying paid product invoice starts accrual; 300,000 AMD is one order envelope before KPI; salary-multiple ceiling is gone | M-04, M-06       | V-04, V-05, V-09             | P1, P2 for period/KPI inputs used by accrual |
| P4    | Every project bonus component is visible; Finance chooses amounts; Development installments and extra awards stay separate; old unpaid amounts remain             | M-05, M-06       | V-06, V-07, V-10             | P3                                           |
| P5    | Cash, drafts, and releases stay distinct; salary is paid first; reversals restore the original split; registers agree                                             | M-07, M-06       | V-11, V-12                   | P4                                           |
| P6    | New rules apply from a supplied cutover month; synthetic full payroll matches independent expected amounts                                                        | M-09, M-10, M-11 | V-13, V-14, V-17, V-18, V-19 | P1–P5                                        |

M-09 evidence is collected inside P1–P5 on the paths each slice changes. P6 repeats the integrated race and recovery cases.

## P1 — Access, actor, lifecycle, PAID

### P1-S1 — Financial permissions and authentic approver

| Field            | Content                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | `VERIFIED`                                                                                                                                                                                                                                                                                                                                                                                        |
| **M / V**        | M-01; V-15 (authorization and forged approver). Lifecycle/PAID remains P1-S2                                                                                                                                                                                                                                                                                                                      |
| **Executor**     | Grok 4.6 High                                                                                                                                                                                                                                                                                                                                                                                     |
| **Reviewer**     | Claude Opus 5.5 Medium, after implementation                                                                                                                                                                                                                                                                                                                                                      |
| **Current code** | `payroll-runs.controller.ts` and `bonus.controller.ts` have no `@RequirePermission`. `PermissionGuard` allows a route with no metadata. Compensation activate and bonus release create/patch accept `approvedById` from the body. Wallet ownership is a separate `me/wallet` path                                                                                                                 |
| **Contract**     | Use existing `FINANCE_SALARY` and `FINANCE_BONUSES`. Do not add a module or change role grants. Owner, CEO, and Finance Director already have full access. Accountant stays read-only. HR has no salary or bonus grant. Delivery/Sales `FINANCE_BONUSES` OWN stays own-only                                                                                                                       |
| **Acceptance**   | A caller without the action is denied before a write or salary disclosure. OWN cannot read or edit another employee. DEPARTMENT cannot leave its departments. ALL Finance/CEO/Owner can prepare and approve alone. A body `approvedById` cannot be stored as the actor. Company rate edits require ALL, not OWN. `GET /me/wallet` still works for the signed-in employee without `FINANCE_SALARY` |

### P1-S2 — Lifecycle, payment evidence, exception reasons

| Field          | Content                                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**     | `VERIFIED`                                                                                                                                                                                                                                                |
| **M / V**      | M-08; V-12, V-15 (reasons and PAID)                                                                                                                                                                                                                       |
| **Executor**   | Grok 4.6 High                                                                                                                                                                                                                                             |
| **Reviewer**   | Claude Opus 5.5 Medium                                                                                                                                                                                                                                    |
| **Acceptance** | Direct create cannot set `PAID` without payout evidence. Extra, early, and over-funding drafts require the existing reason on every path, including the matrix. Draft, release, approval, and cash stay distinct. Repeat calls do not duplicate a release |

## P2 — Periods, AMD, KPI, Probation

| Slice                                                                             | Status     | M / V                  | Acceptance                                                                                                                                                                                         |
| --------------------------------------------------------------------------------- | ---------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-S1 Month-effective salary, future activation, missing profile blocks inclusion | `VERIFIED` | M-02; V-01, V-02, V-16 | Full salary from day 1 of the selected month. Future activation does not change today. Missing terms are not zero. Explicit Sales Probation with no fixed salary remains payable for Sales bonuses |
| P2-S2 Individual monthly KPI targets and Probation/Active history                 | `VERIFIED` | M-02, M-10; V-08, V-16 | Same calendar-month scale. No whole-Probation engine, no automatic proration, no automatic hiring. Status change does not duplicate accruals                                                       |
| P2-S3 AMD take-home currency contract                                             | `VERIFIED` | M-03; V-03             | AMD proceeds. USD/EUR and mixed inputs are rejected. No hidden conversion and no second tax deduction                                                                                              |

## P3 — Sales accrual and ceilings

| Slice                                                                   | Status     | M / V                  | Acceptance                                                                                                                                                                                 |
| ----------------------------------------------------------------------- | ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P3-S1 Both Sales roles persist, including one employee                  | `VERIFIED` | M-04; V-04, V-05       | Unique protection does not drop a role. Replay keeps one pair                                                                                                                              |
| P3-S2 Qualifying invoice, minimum, event-date snapshot                  | `VERIFIED` | M-04; V-04, V-14       | Full payment of the first qualifying product invoice. Domain invoices do not qualify. Minimum covers the capped combined accrual. Rates come from the receipt event, Asia/Yerevan fallback |
| P3-S3 Shared 300,000 order envelope before KPI, including subscriptions | `VERIFIED` | M-04, M-06; V-05, V-09 | One envelope per order. 8:2 splits 240,000/60,000. Excess is not later debt. KPI 1 / 0.5 / 0 applies after the cap                                                                         |
| P3-S4 Remove salary-multiple monthly ceiling without erasing old carry  | `VERIFIED` | M-06; V-09, V-10       | No one/two/three-salary limit. Existing unpaid carry remains for manual settlement. No bulk reprice. Commit `aaf7511cc`                                                                    |

## P4 — Sources, manual allocation, old balances

| Slice                                                                 | Status     | M / V                        | Acceptance                                                                                                                           |
| --------------------------------------------------------------------- | ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| P4-S1 Matrix sums every source entry                                  | `VERIFIED` | M-05; V-06, V-07             | Two entries of 50 and 70 display 120. Trace to sources remains. Commit `5299c4022`                                                   |
| P4-S2 Explicit project amounts, Development installments, extra award | `VERIFIED` | M-05, M-08; V-06, V-07, V-12 | 200,000 plan can be paid 40,000 + 10,000 + 120,000. Extra 30,000 is a separate reasoned entry. Draft is not cash. Commit `3f917cce6` |
| P4-S3 Older unpaid entitlements stay payable                          | `VERIFIED` | M-05, M-06; V-10             | Month rollover and termination do not drop a real unpaid amount. No project FIFO. Commit `637dd783f`                                 |

## P5 — Cash, reversals, registers

| Slice                                                    | Status     | M / V                  | Acceptance                                                                                                                           |
| -------------------------------------------------------- | ---------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| P5-S1 Salary-first cash and explicit project attribution | `VERIFIED` | M-06; V-12, V-19       | Partial combined payout settles remaining salary first. Bonus cash is explicitly assigned. Components equal cash. Commit `598eef803` |
| P5-S2 Reversal restores the original links               | `VERIFIED` | M-07; V-11             | Refund of 50,000 leaves paidAmount 300,000. Paying the bonus again stores 320,000. Closed run rejects the write. Commit `71e1d9e49`  |
| P5-S3 Register reconciliation                            | `VERIFIED` | M-06, M-07; V-11, V-17 | After 320,000 cash wallet paid is 20,000. Delete reverses the journal to 0. Commit `8e285fd1c`                                       |

## P6 — Cutover inventory and acceptance

| Slice                                                | Status        | M / V                        | Acceptance                                                                                                                             |
| ---------------------------------------------------- | ------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| P6-S1 Safe inventory of old unpaid balances          | `IN_PROGRESS` | M-10; V-18                   | Read-only inventory. No live correction, no mass cap removal, no double recovery                                                       |
| P6-S2 Independent synthetic payroll                  | `PLANNED`     | M-11; V-13, V-14, V-17, V-19 | Expected amounts are calculated before reading the implementation result. Browser Finance flows included when a local app is available |
| P6-S3 Canon reconciliation for implemented decisions | `PLANNED`     | M-10                         | Touched canon matches sections 0 and 6. Superseded salary-cap and whole-Probation text is marked historical                            |

## Out of scope

No Probation-wide KPI engine, mandatory second approver, automatic project payment queue, tax engine, bank transfer, new FX system, department salary split, or payroll scheduler for first launch.
