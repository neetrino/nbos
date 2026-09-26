# Payroll — final completion plan and business decision register

**Assessment date:** 2026-09-26. **Source:** the completed independent audit of revision `68465d3148d104261729351b0b94cd86e3135115`, recorded in [09](09-INDEPENDENT-VERIFICATION.md). **Launch gates:** [10](10-LAUNCH-READINESS.md).

This is a plan for future authorized implementation. Document approval authorizes neither code changes nor approval of proposed compensation rules. No fixes, production migration, deployment, real payroll or financial data correction were performed as part of creating this plan.

## 1. Completion principles

- Fix established defects without reopening settled business requirements.
- Ask the Product Owner only for unresolved business choices; never present recommendations as approved rules.
- Preserve existing financial history. Use explicit corrections where canon requires them.
- Keep accrued, released, included, carried and actually paid amounts distinguishable and reconcilable.
- Use applicable existing architecture; do not redesign the stack to solve bounded payroll defects.
- Treat verification with mocks as component evidence. Database/API/browser acceptance is separate.
- Do not invent real employee salaries, tariffs, production units, legal deductions or attendance rules.

## 2. Mandatory implementation actions

### M-01 — financial authorization and authentic approval attribution

- **Description/module:** inventory and enforce read/write/approval permissions and object scopes across Payroll, Bonus, Sales policies, Compensation and linked payment operations. Bind actual approval to authenticated identity.
- **Reason/evidence:** D-01/D-06; payroll/bonus controllers lack declarations and the global guard allows undecorated routes; profile/direct release accept supplied approver IDs. See document 09 for source paths.
- **Business impact:** prevent disclosure of salaries, unauthorized changes and false attribution of money decisions.
- **Dependencies:** agreed authority matrix; BD-05 only for additional separation/threshold policy. Authentic attribution itself is mandatory already.
- **Required validation:** V-15 through actual HTTP guards, plus own/department/all scopes, guessed IDs and private normative-field responses.
- **Acceptance:** unauthorized requests are denied before mutation/data disclosure; supplied IDs cannot impersonate an approver; legitimate actors retain approved access.

### M-02 — mandatory, period-correct compensation and employee inclusion

- **Description/module:** correct effective profile selection and future activation in Compensation/Payroll/Wallet; block missing required profiles; define eligible employees by approved employment-period rules and final-settlement obligations.
- **Reason/evidence:** D-02/N-01/N-09; profile selection excludes archived history, activation overwrites fallback, seeding permits zero and omits terminated employees.
- **Business impact:** prevent incorrect fixed pay and missing first/final payroll.
- **Dependencies:** BD-07/08 for midmonth changes, hire/termination/leave and retro handling; approved mandatory-profile rule is not open for reconsideration by default.
- **Required validation:** V-01/V-02/V-16; past/current/future boundaries, overlap, concurrent activation, new hire and rehire.
- **Acceptance:** each included salary has approved effective terms and an explainable period result; future activation does not alter today's pay; missing data blocks rather than becoming zero; payable final obligations remain accessible.

### M-03 — currency preservation and incompatibility control

- **Description/module:** establish a currency contract spanning Compensation, Payroll, Bonus and Expenses; carry sufficient currency evidence or block incompatible flows.
- **Reason/evidence:** N-05/P-05; expense materialization selects but drops profile currency, while Delivery v2 uses AMD and forbids hidden conversion.
- **Business impact:** prevent adding or paying numerically equal but economically different currency amounts.
- **Dependencies:** BD-06; the Owner may choose a restricted first launch without authorizing implicit conversion.
- **Required validation:** V-03 with AMD/USD/EUR and mixed components; approved rate/date/source tests only if conversion is selected.
- **Acceptance:** every payable amount has an unambiguous currency; unsupported combinations cannot reach approval; any approved conversion is explicit, reproducible and snapshotted.

### M-04 — complete Sales accrual, event-date rates and failure recovery

- **Description/module:** reconcile Sales role persistence with duplicate protection, resolve policy by the approved qualifying event, and implement reliable recovery of missing accruals.
- **Reason/evidence:** D-05/D-07/N-02; same-employee roles collide with the invoice/employee unique key; policy uses processing time; failures are logged without demonstrated accrual retry.
- **Business impact:** preserve all legitimate Sales compensation exactly once, including delayed entry and recoverable failures.
- **Dependencies:** BD-01/11/14; coordinate uniqueness changes with existing rows and migrations. Any repair/backfill of real data requires separate authorization.
- **Required validation:** V-04/V-05/V-14; Classic and subscription models, two roles, recurring, replay, rate changes and missing-policy exceptions.
- **Acceptance:** both applicable roles are retained, one event cannot pay twice, delayed entry uses the correct snapshot, and every qualifying payment reconciles to accruals or an owned visible exception.

### M-05 — complete multiple-entry and older-entitlement payroll inclusion

- **Description/module:** aggregate and allocate all legitimate source bonuses in the matrix; preserve source-entry traceability; complete late-funded and prior-period settlement paths.
- **Reason/evidence:** N-03/N-09/P-09/P-11; the matrix selects one entry and a strict previous-month predicate excludes older unpaid entries.
- **Business impact:** prevent underpayment of multiple roles/functions and old obligations. A new fictitious bonus must not be needed to pay an existing entitlement.
- **Dependencies:** M-02/M-04; established carry/remaining entitlement rules; BD-07/08/12 for correction and settlement timing where applicable.
- **Required validation:** V-06/V-07/V-10/V-16; multiple entries per employee/order, multiple orders, approved existing releases, late funding and terminated employees.
- **Acceptance:** displayed, drafted, materialized and paid totals equal the intended sum of source entries; remaining entitlements stay payable after month rollover; historical earned periods are preserved.

### M-06 — correct cap, carry and actual-paid projections

- **Description/module:** reconcile included versus deferred amounts across Payroll, BonusEntry, Releases, Wallet and Pools; apply carry independently of new bonuses.
- **Reason/evidence:** N-07/P-07/P-08; gross release amounts become paid while carry remains; carry application is reached only from new attach.
- **Business impact:** employees and Finance see the real paid amount and remaining debt; quiet months do not omit carried compensation.
- **Dependencies:** BD-03 for zero-base policy; BD-12 for partial-payment attribution; M-05 for source traceability.
- **Required validation:** V-09/V-10/V-12, repeated sync and multi-month FIFO/reversal cases.
- **Acceptance:** synthetic 300 gross / 200 included / 100 deferred never reports 300 actually paid; the remaining 100 can be paid in a month with no new bonus; no double consumption or unexplained debt disappears.

### M-07 — audited reversals and historical corrections

- **Description/module:** implement governed correction paths for client refunds/removal, employee payout reversal and salary adjustment, keeping operational journal and all payroll projections aligned.
- **Reason/evidence:** D-03/D-04/N-08; deletion leaves Sales accrual, release-paid state or journal lines inconsistent.
- **Business impact:** avoid overpayment, false balances and loss of an explainable financial history.
- **Dependencies:** BD-04/07/12 and M-06; existing clawback-from-future-bonuses rule remains binding. Approval authority comes from M-01.
- **Required validation:** V-11/V-14, partial/full reversal before/after release/approval/payment, open posting period and closed payroll/posting period combinations.
- **Acceptance:** every correction has source linkage, actual actor and reason; impacted ledgers reconcile; closed historical amounts are not silently rewritten; fixed salary is not used for clawback contrary to canon.

### M-08 — enforce financial invariants on every entry path

- **Description/module:** validate allowed lifecycle transitions, payout evidence, exception reason and approval consistently in direct Bonus API and matrix materialization.
- **Reason/evidence:** N-04/P-03/P-10; direct PAID creation and reasonless extra drafts bypass controls enforced elsewhere.
- **Business impact:** authorized users cannot accidentally or deliberately create unsupported paid records or untraceable exceptions.
- **Dependencies:** M-01 and BD-05 where additional approval separation is selected.
- **Required validation:** V-12/V-15 for direct API, matrix and internal service paths, including attempts against approved/closed runs.
- **Acceptance:** a PAID fact requires payment evidence; extra/early/over-funding exceptions require the documented reason/approval; alternate endpoints cannot bypass these constraints.

### M-09 — atomicity, idempotency and reconciliation under failure

- **Description/module:** protect payout remaining balances, release generation, payroll approval/materialization and profile activation against races and retries using the existing database architecture.
- **Reason/evidence:** N-06/P-06 and U-04; payout checks precede inserts without a shared atomic guard; other real database races were not verified.
- **Business impact:** prevent excessive/duplicate records and partial financial effects after a crash.
- **Dependencies:** corrected invariants in M-02/M-04/M-05/M-06/M-08; database migration/backfill planning if constraints change.
- **Required validation:** V-13/V-14 against isolated PostgreSQL with barriers/concurrent requests and injected failures between writes.
- **Acceptance:** concurrent calls cannot exceed obligations, duplicate an economic event, create duplicate approval expenses or double-consume carry; replay converges to one reconciled outcome.

### M-10 — close applicable business requirements and missing launch functionality

- **Description/module:** approve the normalized decisions below, identify initial employees/pay types/currencies and complete required policy/department workflows or explicitly approve a bounded controlled alternative.
- **Reason/evidence:** U-02/U-03, BD register, documented policy hierarchy and manual Marketing/Support templates.
- **Business impact:** one set of facts produces one agreed pay result; manual exceptions have accountable ownership instead of hidden defaults.
- **Dependencies:** Product Owner answers and approved examples; statutory scope requires qualified jurisdiction-specific input if included.
- **Required validation:** V-08/V-16/V-17 and signed examples for every supported department/policy.
- **Acceptance:** no applicable unresolved question remains; proposals are distinguished from approved rules; unsupported cases are explicit and cannot silently enter the ordinary payroll path.

### M-11 — isolated full acceptance and launch evidence

- **Description/module:** verify migrations/permissions and complete the entire synthetic employee-to-payment-to-report flow with Finance and Owner acceptance.
- **Reason/evidence:** 646 unit/mock tests and 11 probes do not establish deployed correctness; TODO records Delivery live acceptance gaps.
- **Business impact:** demonstrate that the corrected implementation can execute the intended first payroll without unexplained differences.
- **Dependencies:** applicable M-01–M-10 complete; Owner-approved real Delivery norms/rates for the eventual launch, with synthetic fixtures kept separate; authorized nonproduction environment.
- **Required validation:** all applicable V-01–V-17, desktop/mobile workflows, independent expected amounts and recovery procedures.
- **Acceptance:** evidence records environment, revision, fixtures, expected/actual outputs, reconciliation and named acceptance. No production action follows automatically; launch/cutover authorization is separate.

## 3. Implementation dependency order

1. M-01 establishes financial access and authentic attribution. M-08 closes alternate state/reason bypasses.
2. Owner decisions in M-10 proceed in small related groups. Existing required controls need no new compensation formula decision.
3. M-02/M-03 establish salary periods and currencies. M-04 establishes reliable Sales inputs.
4. M-05/M-06 preserve aggregation, old entitlements and carry; M-07 reconciles corrections across history.
5. M-09 validates and fixes concurrency/failure boundaries alongside each money-path change, not only at the end.
6. M-11 proves the integrated outcome after applicable dependencies pass.

For subsequent authorized implementation, follow repository workflow and relevant review/security/verification skills. This plan does not itself authorize commits, production changes, or implementation.

## 4. Exact required validation scenarios

All fixtures must be synthetic on an explicitly isolated environment. Expected amounts must be prepared independently of the application. Monetary examples here are test inputs, not approved employee rates.

| ID   | Scenario                                                                                                                                                                                                          | Required acceptance                                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | Create employee and accept invitation; create/approve initial compensation; attempt payroll with no profile, draft-only profile and explicitly approved zero salary                                               | Registration preserves identity; missing/draft terms block payroll; intentional zero is distinguishable from missing data; first salary matches approved terms          |
| V-02 | Historical/current/future profiles, month boundary, midmonth change, overlapping intervals, backdated correction and simultaneous activation                                                                      | Correct effective terms and approved proration; no premature future salary; no ambiguous active interval; historical paid line changes only through approved correction |
| V-03 | AMD, USD, EUR profiles; AMD Delivery plus incompatible salary; supported conversion if selected; rounding boundaries                                                                                              | Currency preserved or incompatible path rejected; no implicit addition/conversion; explicit rate/source/date snapshots when applicable                                  |
| V-04 | Classic first partial/full payment, several invoices/tranches, repeated qualifying event; each used From including Network; delayed/backdated payment and policy change                                           | Owner-approved trigger; correct event-date independent Seller/Assistant rates; one qualifying accrual wave, stable historical snapshot                                  |
| V-05 | Subscription first invoice, multi-month first invoice, later recurring invoice, recurring zero rates; same employee in both roles; replay/concurrent source events                                                | First-month base correct; recurring distinct; both role entitlements preserved; no duplicate or silently discarded legitimate row under actual SQL constraints          |
| V-06 | Several eligible bonuses for one employee/order, several orders, two Delivery roles and multiple core/function components; already approved source releases                                                       | Matrix totals and source allocation retain every component; no ordinary entitlement incorrectly classified as extra; no duplicate release consumption                   |
| V-07 | Delivery Product and Extension: enrollment, missing norms/rates/assignees, Starting→Development, repeated transition, scope/team revisions, Done, partial/full and later funding, reopen lock, legacy coexistence | Readiness gates/atomic plan hold; correct component snapshots and sums; all legitimate amounts reach payroll; old legacy amounts are not silently recalculated          |
| V-08 | KPI below 50%, at 50%, below/at 70%; missing plan/result/actual, zero target; policy/version changes and earned-month freeze                                                                                      | Approved gate and missing-data behavior; no unexplained full-factor default; frozen/history behavior follows approved correction rules                                  |
| V-09 | Bonus below/at/above cap, multiple bonuses, zero Fix, partial use of cap, multi-month carry and repeat synchronization                                                                                            | Included plus remaining equals eligible amount; approved zero-base rule; no double counting; 300/200/100 fixture reports paid 200 only after that actual payment        |
| V-10 | Next payroll has carry but no new bonus; ordinary unpaid bonus remains after several months; Done work funded later                                                                                               | Old obligations can be paid without fictitious fresh earnings or altered earned dates; carry is applied independently and source debt remains traceable                 |
| V-11 | Partial/full client refund or removed payment before release, after approval and after payout; employee payout reversal; closed payroll/open posting period and closed posting period                             | Audited corrections; fixed salary protected from clawback; bonus/KPI/payment/journal/Wallet reconcile; explicit closed-history correction path                          |
| V-12 | Draft→Review→Approved→Paying→Closed; review edits denied; partial/full payment; held/zero lines; unsupported PAID injection; extra/early/over-funding without reason/approval                                     | Valid transitions only; one linked expense per intended payable line; actual paid evidence; exceptions require proper controls; closure criteria met                    |
| V-13 | Concurrent payout requests against one remaining balance; concurrent release, approval, initial plan, carry consumption and profile activation                                                                    | No excessive or duplicate amounts, orphan approval expenses, overlapping effective state or lost legitimate entitlement on isolated PostgreSQL                          |
| V-14 | Failure after payment persistence, during accrual, between expense/line/journal writes and during release sync; retry/backfill; repeated reversal                                                                 | One durable financial effect, visible owned exceptions, recoverable reconciliation, no silent partial history or duplicate recovery                                     |
| V-15 | Authenticated role with no financial rights; own-only and department scopes; Finance/CEO/Owner; guessed record IDs; forged approver; private normative fields; alternate endpoints                                | No unauthorized read/write; authentic attribution; approved object/field scope; route-independent invariants                                                            |
| V-16 | Hire/termination midmonth, leave/unpaid absence, rehire; Active bonus due after termination; multiple departments; Marketing/Support process if included                                                          | Approved employment-period treatment; final obligations retained; one employee payment without double salary; approved department/manual policy evidence                |
| V-17 | Full independent payroll comparison and desktop/mobile UI: profiles, matrix, boards, Wallet, Pay Now and reports                                                                                                  | SalaryLine/PayrollRun/Expense/ExpensePayment/BonusRelease/carry/Pool/Wallet/Journal agree; clear currencies/statuses; Finance and Owner accept intended launch scope    |

Existing tests and probes are listed in document 09. These acceptance scenarios are **required future validation**, not claims that the completed audit executed them end to end.

## 5. Existing documented rules — preserve, do not present as new recommendations

| Rule                                                                                                             | Authority / implication                                                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Compensation must use terms effective in the payroll period; old profiles are archived, not silently substituted | Compensation canon §Compensation Profile; D-02 requires correction                                      |
| Included employee needs an active effective profile before payroll starts                                        | Compensation canon validation rules, line 358; fallback permission is not an unanswered business choice |
| One person as Seller and Assistant receives both independent rates                                               | Bonus/Payroll logic Sales section; duplicate protection must preserve both amounts                      |
| Sales source/rate snapshot belongs to the qualifying payment event                                               | Same canon; timestamp/tie details still need specification                                              |
| Clawback comes from future bonuses, not fixed salary; company-fault exceptions involve CEO                       | Bonus/Payroll logic clawback and exceptional situations                                                 |
| Active bonuses remain payable on termination; Incoming treatment follows documented rule                         | Bonus/Payroll logic exceptional situations; final-settlement implementation is incomplete               |
| Deferred bonus amounts must remain traceable and payable                                                         | Cap/carry and partial-release canon; lack of fresh work cannot silently erase debt                      |
| Extra, early and over-funding exceptions require documented reason/approval as applicable                        | Finance Bonus/Payroll canon; all write paths must enforce it                                            |
| Delivery v2 uses role component norms/rates, without legacy 70/30 or employee/grade rate overrides               | Delivery Compensation v2 supersedes legacy text                                                         |
| Delivery v2 money is AMD; incompatible currency needs an explicit blocker, with no hidden conversion             | Delivery v2 §5                                                                                          |
| Actual approver identity and historical financial evidence must be trustworthy                                   | Compensation approval/audit and Finance lifecycle requirements                                          |

No recommendation below revokes these rules. Any requested change to canon would require an explicit decision identified as a change, not an assumption.

## 6. Normalized unresolved business decisions

All prior BD-01–BD-14 are accounted for below. Splitting an ID into several small questions is allowed; it must not imply that the whole ID is resolved by one partial answer. Additional details highlighted by N findings are attached to their related decisions rather than inventing unrelated product requirements.

| ID    | Current behavior / known requirement                                                                                                   | Actual unresolved question                                                                                                                                                                  | Dependencies and scope                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| BD-01 | Sales runs only when an invoice is fully PAID; canon also says first confirmed money                                                   | For partial Classic invoices and multiple tranches, which event creates the one-time full entitlement, or is an explicit staged policy required?                                            | M-04, V-04; resolve the wording conflict with examples                              |
| BD-02 | Missing KPI result or incomplete facts may produce factor 1                                                                            | Hold affected bonus, allow a controlled explicit override, or another documented missing-data policy? Who resolves it and before which deadline?                                            | M-10/M-04, V-08; distinguish no required KPI from missing required facts            |
| BD-03 | Base salary <=0 bypasses cap; ordinary cap is related to Fix                                                                           | Are zero-Fix employees allowed; if yes, what explicit cap/exception applies? Are role exceptions needed?                                                                                    | M-06, V-09; missing salary is not the same as approved zero                         |
| BD-04 | Client payment deletion leaves Sales accrual; future-bonus-only clawback is already canon                                              | Partial reversal proportionality, unreleased/released/paid handling, CEO exceptions, recovery timing and residual debt after employment ends                                                | M-07, V-11/V-16; do not offer Fix deduction as existing policy                      |
| BD-05 | Some routes trust supplied approver; payroll approval uses current actor                                                               | Which authorized roles may propose/approve each money action; must two people act; are exception thresholds needed?                                                                         | M-01/M-08, V-15; authentic actor cannot be waived as a mere preference              |
| BD-06 | Profiles accept currency; payroll expense loses it; Delivery is AMD                                                                    | First-launch currencies; block incompatibility, separate lines, or explicitly approved conversion with source/date/rounding                                                                 | M-03, V-03; no exchange-rate policy inferred                                        |
| BD-07 | Latest overlapping ACTIVE profile supplies a whole-month base; no approved proration established; historical changes need correction   | Midmonth salary-change formula, effective-day inclusivity, permitted scheduling, retro adjustment timing and whether correction uses a later payroll or separate controlled settlement      | M-02/M-07, V-02/V-11                                                                |
| BD-08 | Current non-terminated employees receive full seeded base; terminated staff are excluded; Active bonuses after termination remain owed | Hire/termination proration, paid/unpaid leave and absence facts, rehire period treatment, accountable input owner and final-settlement timing                                               | M-02/M-05, V-01/V-16; termination entitlement is already settled, mechanics are not |
| BD-09 | Multiple department memberships; one employee/month line; board filtering, limited comparative reporting                               | Central or primary-department fixed-pay cost, or explicit allocation; required project/order reporting and reconciliation                                                                   | M-10/M-11, V-16/V-17; no automatic salary multiplication                            |
| BD-10 | Marketing/Support manual templates; hierarchy and automatic formulas incomplete                                                        | Which departments/agreements enter first launch; controlled manual process versus required automation; necessary policy precedence/overrides and accountable approver/evidence              | M-10, V-16; Delivery v2 override prohibition remains                                |
| BD-11 | Sales policy lookup uses processing time; event snapshot is already required                                                           | Exact authoritative qualifying event/date/timezone, tie rejection/order, policy version edits and backdated correction handling                                                             | M-04/M-07, V-04; choose details, not arbitrary current-time repricing               |
| BD-12 | Entire release marked PAID after full line payout; partial attribution not established; reversal incomplete                            | Fix-first, proportional or another explicit attribution for partial employee payments; operator-facing correction workflow and approvals                                                    | M-06/M-07, V-09/V-11/V-12; consistency itself is mandatory                          |
| BD-13 | Proven path is gross Fix+bonus approval and internal payout recording                                                                  | Is first launch a gross-pay ledger or a complete net-pay/statutory process? If expanded, identify jurisdictions, external responsibilities, payslips and bank execution requirements        | M-10/M-11; no legal compliance claim or formula inferred                            |
| BD-14 | Accrual failure logged; no general missing-accrual recovery demonstrated                                                               | Preserve valid cash recording and retry with an owned exception queue, or an approved transactional rejection workflow; owner, escalation deadline and payroll approval gate for exceptions | M-04/M-09, V-14                                                                     |

### Additional operating details to settle within those decisions

- Before implementation, use one worked example to distinguish the salary service month, bonus earned month and payout month. Existing code uses payroll month minus one for bonus eligibility; the audit does not authorize silently moving a salary period. Resolve any remaining terminology conflict with BD-07 and acceptance V-17.
- Decide timing/approval of late and final settlements under BD-07/08/12. The right to valid unpaid amounts is not optional.
- Confirm whether all first-launch employees use explicit individual terms or require the documented hierarchy under BD-10. Do not guess precedence from current code.
- Clarify who creates the monthly run and reconciles exceptions under BD-13/14 if automatic monthly run creation is not in the chosen scope.

## 7. Interactive Product Owner workflow

All communication with the Product Owner must be in Russian, using business consequences rather than unnecessary implementation terminology. Documentation may remain English for implementing agents.

Present only two or three related questions per turn. For each question explain meaning, observed current behavior, missing/unclear behavior, two to four realistic options with advantages/disadvantages, a clearly labeled recommendation, and a choice request. Wait for answers before the next group. Unknown current behavior must be stated as unknown.

Decision sequence, adjusted after the Owner's first answer:

1. Q-01 salary changes: record monthly effective terms and future scheduling (BR-01/02); do not continue asking for ordinary midmonth proration.
2. Q-02 new hires: record the normal next-month salary setup and conditional current-open-month correction request (BR-03). Do not combine this with termination.
3. Q-03 termination/final salary calculation: a separate open decision (BD-08/12).
4. Q-04 meaning of an unpaid month eligible for correction: no employee payment versus partially paid, plus the required approval/closed-period boundary (BD-07/12).
5. Remaining salary inputs: leave/unpaid absence and launch currencies (BD-08/06).
6. Bonus calculation controls: missing KPI and zero-Fix cap (BD-02/03).
7. Sales events: partial Classic trigger and historical rate/version details (BD-01/11).
8. Partial payments and corrections: attribution, remaining retro correction and clawback details (BD-12/07/04).
9. Authority and exceptions: maker/checker and failed-accrual operations (BD-05/14).
10. Launch scope and reporting: gross/net/statutory/bank responsibilities, departments/policy hierarchy, cost attribution and remaining operating responsibilities (BD-13/10/09).

Present only two or three related questions at a time. The register in section 6 remains the audit's unresolved-question inventory; approved subparts below take precedence for future implementation planning. A partially resolved BD must not be marked fully resolved. Documents 09 and 10 describe the completed audit baseline; later decisions do not retroactively establish implemented behavior or readiness.

### Proposals — not approved requirements

| Proposal ID | Subject                                               | Recommendation                                                                                                                                                                                                                     | Reason / tradeoff                                                                                                        | Status                                                                                         |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| P-SAL-01    | Ordinary midmonth salary changes                      | Calendar-day proration                                                                                                                                                                                                             | Earlier proposal assumed day-based changes                                                                               | Superseded for ordinary salary changes by Owner's monthly effective-date model; never approved |
| P-SAL-02    | Combined hire/termination proration                   | Calendar-day proration for both events                                                                                                                                                                                             | Earlier proposal combined two distinct business cases                                                                    | Not approved; new-hire setup is BR-03; termination is separately open as Q-03                  |
| P-TERM-01   | Final salary on termination                           | Record the manually entered last employment day and an explicitly approved final fixed-salary amount, with reason; no guessed automatic proration                                                                                  | Avoids inventing a formula where none is agreed; adds manual work and requires review                                    | Proposed only; Q-03 unanswered                                                                 |
| P-CORR-01   | Eligibility for ordinary past-month salary correction | Permit controlled correction only when that employee has no payment recorded for the service month and the relevant payroll/posting period is not closed; approved amounts require renewed approval and consistent expense updates | Preserves payment history and bounds implementation complexity; partially paid cases need a separate adjustment workflow | Proposed only; Q-04 unanswered; not existing implemented functionality                         |

Recommendations remain separate from approved rules. No recommendation establishes jurisdictional or contractual compliance; that scope remains under BD-13. No additional implementation investigation was performed to record this answer.

### Agreed business rules from the interactive process

**Owner answer recorded on 2026-09-26.** The user described monthly salary effective dates and payment timing rather than selecting the previously proposed calendar-day formula. The records below distinguish approved direction from conditional requests and unanswered boundaries. No application functionality has changed.

#### BR-01 — salary service month and payout window

- **Source / related questions:** Owner's first answer; Q-01, BD-07, period terminology detail in section 6.
- **Approved rule:** fixed salary for a service month is paid during days 1–15 of the following month. The month whose salary is being earned must be distinguishable from the month in which money is paid.
- **Illustration of the approved timing:** salary effective for October is used for October compensation, normally paid November 1–15. Changing October terms does not change September compensation paid during October 1–15.
- **Scope:** this answer establishes salary timing. It does not by itself change the documented bonus payout window or approve a new bonus-period mapping.
- **History:** the answer establishes the intended operating rule; treatment of existing records with a different payroll-month interpretation still requires an explicit migration/correction design and authorization.
- **Open details:** who prepares/approves payroll, whether calendar-day deadline exceptions are needed, and the effect on existing payroll labels/records were not selected. Do not infer a new payday, statutory rule or bonus deadline.
- **Implementation / validation:** M-02/M-10/M-11; V-02/V-17. Approved business rule, not implemented or independently verified behavior.

#### BR-02 — month-based salary changes and future scheduling

- **Source / related questions:** Q-01, BD-07.
- **Approved rule:** when setting a changed fixed salary, select the service month from which the new amount applies. Future months must be selectable, including the next month and months farther ahead. This applies to increases and decreases. Ordinary salary changes use monthly effective terms, not the previously proposed ordinary midmonth proration.
- **Operational intent:** most changes are scheduled for a future service month; that month's compensation is paid in the following month's payout window under BR-01. Earlier months keep their applicable terms.
- **Conditional retrospective request:** the Owner wants to correct a prior **unpaid** service month when an agreed salary change was omitted from the system, provided this can be implemented safely without undue complexity or corrupting history. The payroll amount should then reflect the promised salary before payment.
- **Example supplied by the Owner:** on the 13th, before paying the previous month's salary, discover that a promised salary increase was not entered and correct the previous month's unpaid salary.
- **Not yet approved/defined:** whether unpaid includes partial payment; whether correction is allowed after payroll approval; treatment of a closed period; how other employees' already recorded payments affect the operation; exact correction/reapproval UX and authority. P-CORR-01 is a proposal addressing these boundaries, not the Owner's selected answer.
- **History:** no permission to rewrite already paid history or apply a new rate to an earlier paid month follows from this answer.
- **Implementation / validation:** M-02/M-07; V-02/V-11/V-17. Month selection/future scheduling is approved direction; retrospective correction remains conditional pending Q-04 and design/validation. No claim that this is a trivial existing capability.

#### BR-03 — initial salary for a new employee

- **Source / related questions:** Q-02, new-hire portion of BD-08; termination is explicitly separate.
- **Approved normal workflow:** configure the employee's initial fixed/minimum salary for the next selected service month. Do not silently infer the salary start month from the date the record was entered.
- **Conditional exception requested:** allow selection of the current open service month when setup was forgotten, such as entering the employee and salary on the 5th, if this can be implemented without unnecessary complexity and without damaging history.
- **Terminology:** minimum/fixed salary here refers to the existing base-salary concept. No separate statutory minimum, bonus top-up, or legal floor is introduced.
- **Not yet approved/defined:** the exception's calculation if the employee actually started midmonth; whether current-month setup means a full monthly salary in every such case; required factual hire date; already approved/partially paid cases; rehire and absence treatment. Do not infer these from the late-record-entry example.
- **Implementation / validation:** M-02/M-10; V-01/V-02/V-16. Normal month-based setup recorded; current-open-month exception remains conditional. No initial-salary formula was invented.

#### Termination — Owner intent recorded, calculation not yet selected

- **Source / related questions:** Q-03, BD-08/12.
- **Confirmed distinction:** termination is a separate business case from hiring. Final fixed salary may cover part of a month; the Owner states there is no established calculation model.
- **Requested capability under discussion:** manually control the relevant termination date (past, current or future) and/or final salary amount. Examples include entering an actual termination ten days late or scheduling the end of employment for the end of the month.
- **Not selected:** manual final amount versus automatic date-based calculation; calendar versus working days; date inclusivity; authority for overrides; relationship between employment date and account access deactivation. Do not assume that recording a financial date authorizes delayed or retrospective access changes.
- **Preserved existing rule:** Active bonuses remain payable after termination; this decision concerns the fixed-salary amount and settlement mechanics, not cancellation of valid bonus obligations.
- **Next step:** present Q-03 with realistic options and recommendation P-TERM-01. M-02/M-05/M-07; V-11/V-16.

### Recording subsequent answers

Record each selected rule separately from proposals with its BD/question IDs, answer date, exact selected behavior, applicability/effective scope, approved numerical examples if supplied, historical handling, accountable roles and remaining unanswered subparts. Link to M/V actions. Approval of a rule is not evidence that code implements it.

Only the three approved audit documents may be created or updated within the authorized documentation scope. Do not create a fourth decision file or edit product canon/application behavior without additional authorization. A dedicated section here keeps selected rules distinct from proposals.

## 8. Optional and conditional future work

| Work                                                        | Dependency and reason                                                                                  | Acceptance if undertaken                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Rich department comparisons and scheduled reporting packets | After mandatory reconciliation and BD-09; improve management visibility rather than repair pay amounts | Totals reconcile to approved cost attribution; no duplicate salary across departments      |
| UI convenience, bulk preparation, nonessential dashboards   | After core money controls; reduce operator effort                                                      | Same authorization/invariants as single-item operations; no hidden changes to compensation |
| Automatic Marketing/Support engines                         | Conditional on BD-10; cannot be deferred if first-launch compensation depends on them                  | Approved metrics, rates, source facts, effective dates and reversals tested                |
| Full general policy hierarchy                               | Conditional on actual agreements and BD-10; not applicable as employee-rate overrides to Delivery v2   | Deterministic precedence and audited reasons/effective dates                               |
| Multiple currencies or explicit FX conversion               | Conditional on BD-06; an AMD-only restriction still needs enforcement                                  | Reproducible currency/rate history and correct expense/report units                        |
| Statutory/net-pay processing, payslips, bank execution      | Separate scope under BD-13, with authoritative jurisdiction-specific requirements                      | Dedicated verified requirements and acceptance; not implied by gross-pay approval          |
| Automatic monthly preparation                               | Only if approved operating scope requires it                                                           | Idempotent run creation, approved inclusion rules and owned failure handling               |

## 9. Completion criteria

The plan is complete only when applicable M actions satisfy their acceptance criteria, all required V scenarios pass in the appropriate environment, applicable decisions are recorded as approved rather than proposed, and Finance/Owner accept the documented first-launch scope.

No completion percentage, delivery estimate, production incident count or readiness date is supported by this audit. Production permission remains a separate decision after evidence review.
