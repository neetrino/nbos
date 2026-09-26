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

### M-06 — remove rejected salary-linked ceiling and reconcile actual paid/remaining amounts

- **Description/module:** remove the salary-linked monthly payout ceiling per BR-29 in the later authorized implementation; reconcile included, actual paid and remaining amounts across Payroll, BonusEntry, Releases, Wallet and Pools. Preserve and reconcile any existing deferred amounts without requiring a new bonus to settle them. Apply the separate Sales order ceiling per BR-30 after remaining formula details are resolved.
- **Reason/evidence:** N-07/P-07/P-08; gross release amounts become paid while carry remains; carry application is reached only from new attach.
- **Business impact:** employees and Finance see the real paid amount and remaining debt; quiet months do not omit carried compensation.
- **Dependencies:** BR-29/30 supersede the prior salary-linked cap policy; BR-15 governs fixed-first partial payments; M-05 supplies source traceability. Existing carry reconciliation and order-cap/KPI calculation details must be resolved without history rewriting.
- **Required validation:** V-09/V-10/V-12, repeated sync and multi-month FIFO/reversal cases.
- **Acceptance:** no payout is limited by one/two/three fixed salaries; multiple qualifying orders may produce a monthly total above those amounts. Historical synthetic 300 gross / 200 included / 100 deferred never reports 300 actually paid; the remaining 100 can be settled without a new bonus. No double consumption, unexplained debt loss or retrospective destruction of records. Existing unpaid balances are not automatically forgiven by removal of the ceiling.

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
3. Q-03 termination/final salary calculation: Owner selected option A; record BR-04 (BD-08/12).
4. Q-04 meaning of an unpaid month eligible for correction: no employee payment versus partially paid, plus the required approval/closed-period boundary (BD-07/12).
5. Remaining salary inputs: leave/unpaid absence and launch currencies (BD-08/06).
6. Bonus calculation controls: missing KPI and zero-Fix cap (BD-02/03).
7. Sales events: partial Classic trigger and historical rate/version details (BD-01/11).
8. Q-13 A resolves fixed-salary-first partial-payment allocation (BR-15); remaining cross-period/bonus-entry attribution, retro correction and clawback details stay open (BD-12/07/04).
9. Q-14 A resolves maker/checker separation and the discussed Finance/Director/Owner approval population (BR-16); remaining failed-accrual ownership details stay open (BD-14).
10. Launch scope and reporting: gross/net/statutory/bank responsibilities, departments/policy hierarchy, cost attribution and remaining operating responsibilities (BD-13/10/09).

Present only two or three related questions at a time. The register in section 6 remains the audit's unresolved-question inventory; approved subparts below take precedence for future implementation planning. A partially resolved BD must not be marked fully resolved. Documents 09 and 10 describe the completed audit baseline; later decisions do not retroactively establish implemented behavior or readiness.

### Proposals — not approved requirements

| Proposal ID | Subject                                               | Recommendation                                                                                                                                                                                                                     | Reason / tradeoff                                                                                                        | Status                                                                                         |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| P-SAL-01    | Ordinary midmonth salary changes                      | Calendar-day proration                                                                                                                                                                                                             | Earlier proposal assumed day-based changes                                                                               | Superseded for ordinary salary changes by Owner's monthly effective-date model; never approved |
| P-SAL-02    | Combined hire/termination proration                   | Calendar-day proration for both events                                                                                                                                                                                             | Earlier proposal combined two distinct business cases                                                                    | Not approved; new-hire setup is BR-03; termination resolved separately by BR-04                |
| P-TERM-01   | Final salary on termination                           | Record the manually entered last employment day and an explicitly approved final fixed-salary amount, with reason; no guessed automatic proration                                                                                  | Avoids inventing a formula where none is agreed; adds manual work and requires review                                    | Selected by Owner as option A; see BR-04                                                       |
| P-CORR-01   | Eligibility for ordinary past-month salary correction | Permit controlled correction only when that employee has no payment recorded for the service month and the relevant payroll/posting period is not closed; approved amounts require renewed approval and consistent expense updates | Preserves payment history and bounds implementation complexity; partially paid cases need a separate adjustment workflow | Payment boundary selected in BR-06; remaining approval/closed-period details are proposals     |

Recommendations remain separate from approved rules. No recommendation establishes jurisdictional or contractual compliance; that scope remains under BD-13. No additional implementation investigation was performed to record this answer.

### Agreed business rules from the interactive process

**Owner answer recorded on 2026-09-26.** The user described monthly salary effective dates and payment timing rather than selecting the previously proposed calendar-day formula. The records below distinguish approved direction from conditional requests and unanswered boundaries. No application functionality has changed.

#### BR-01 — service month and non-blocking usual payout window

- **Source / related questions:** Owner's first answer and subsequent explicit clarification; Q-01, BD-07 and period terminology.
- **Approved rule:** the current month's ordinary payroll pays the **previous service month's fixed salary and bonuses**, using the fixed-salary terms applicable to that previous month. Keep the service/earned month distinct from actual payment dates and internal payroll labels.
- **Usual schedule, not a hard gate:** days 1–15 of the following month are company practice. Do not prohibit recording or making an otherwise authorized payment before day 1 or after day 15 merely because of that window. This clarification supersedes any interpretation of BR-01 as a mandatory system date restriction. It also applies to the described combined salary-and-bonus payroll cycle; do not impose a competing hard bonus-day cutoff from older text.
- **Illustration:** October fixed salary and October bonuses normally enter the November payout process. A salary change effective November must not change the October fixed salary in that payment. Paying late must not cause the system to select a later salary rate or erase an old bonus entitlement.
- **Payment flexibility:** retain partial, deferred and not-yet-paid amounts; fixed salary is usually paid in full, but that practice must not prohibit other scenarios. The Owner particularly emphasized flexible bonus payout amounts. Choosing how much to pay now is distinct from changing the earned entitlement; no automatic cancellation of an unpaid debt was approved.
- **Scope boundary:** the request removes the 1–15 calendar gate, not authentication, approval, balance integrity or closed-history correction controls. It does not authorize real financial operations or rewriting paid history.
- **Audit evidence:** payment recording and partial-payment paths exist. The completed audit did not identify a specific 1–15 hard date gate; no new deployment verification is claimed. Posting-period and workflow checks do exist and must not be confused with a payday-window restriction.
- **Open details:** mapping existing payroll-month labels/records to service month requires implementation care; first-launch migration/correction design, exact approval roles and exception attribution are not decided by this answer.
- **Implementation / validation:** M-02/M-05/M-10/M-11; V-02/V-10/V-12/V-17. Explicitly test authorized payments outside days 1–15, late payment of prior obligations and rate stability. Approved rule, not implemented/verified completion.

#### BR-02 — month-based salary changes and future scheduling

- **Source / related questions:** Q-01, BD-07.
- **Approved rule:** when setting a changed fixed salary, select the service month from which the new amount applies. Future months must be selectable, including the next month and months farther ahead. This applies to increases and decreases. Ordinary salary changes use monthly effective terms, not the previously proposed ordinary midmonth proration.
- **Operational intent:** most changes are scheduled for a future service month; that month's compensation is paid in the following month's payout window under BR-01. Earlier months keep their applicable terms.
- **Conditional retrospective request:** the Owner wants to correct a prior **unpaid** service month when an agreed salary change was omitted from the system, provided this can be implemented safely without undue complexity or corrupting history. The payroll amount should then reflect the promised salary before payment.
- **Example supplied by the Owner:** on the 13th, before paying the previous month's salary, discover that a promised salary increase was not entered and correct the previous month's unpaid salary.
- **Not yet approved/defined:** whether correction is allowed after payroll approval; treatment of a closed period; how other employees' already recorded payments affect the operation; exact correction/reapproval UX and authority. P-CORR-01 is a proposal addressing these boundaries, not the Owner's selected answer.
- **History:** no permission to rewrite already paid history or apply a new rate to an earlier paid month follows from this answer.
- **Implementation / validation:** M-02/M-07; V-02/V-11/V-17. Month selection/future scheduling is approved direction; BR-06 resolves the payment boundary; safe retrospective design/validation and remaining approval/closed-period decisions are still required. No claim that this is a trivial existing capability.

#### BR-03 — initial salary for a new employee

- **Source:** Q-02 description, explicitly clarified and finalized in Q-20 (BR-22); new-hire portion of BD-08. Termination remains a separate rule.
- **Approved rule:** choose the current or a future salary-start month at employee setup/activation. Full monthly fixed salary applies from day 1 of that chosen month, regardless of the date the setup was entered. Normally the next month is chosen. There is no partial first-month salary or hire-date proration in the current business model.
- **Access versus compensation:** access may activate earlier; no fixed salary accrues before the selected salary-start month. Keep the agreed future positive monthly amount, rather than replacing it with a permanent zero salary. BR-23 subsequently approves bonus accumulation before that month and explicitly confirms bonus payouts for Sales Probation.
- **Payment:** salary for the selected service month is normally paid the following month under BR-01, with its non-blocking date flexibility.
- **History / validation:** BR-06/BR-17 govern already paid/closed corrections. M-02/M-10; V-01/V-02/V-16/V-17 must verify full current-month salary, scheduled future salary and earlier access without premature fixed accrual. This explicit answer supersedes the earlier conditional current-month wording and question about partial first-month calculation. No implementation is claimed.

#### BR-04 — termination: manually entered date and final fixed-salary amount

- **Source / related questions:** Owner explicitly selected **Q-03 option A**; BD-08/12.
- **Approved rule:** record the last employment day and a manually determined, explicitly approved fixed-salary amount for the final month, with an explanation. Do not invent calendar-day or working-day automatic proration. This is separate from new-hire salary setup.
- **Dates:** the Owner's earlier examples include a past date entered late, a current date and a scheduled future end of employment. Capture the factual date separately from the record-entry date; do not silently rewrite payment history when a past date is entered.
- **Preserved obligations:** valid bonuses and other already owed amounts remain separate from the final fixed-salary amount. Active bonuses remain payable after termination under existing canon.
- **Open details:** exact approver permissions, correction if the final month was already partially/fully paid, settlement timing and relationship to account access deactivation remain to be resolved. No employment date alone authorizes retroactive access changes or restoration.
- **Implementation / validation:** M-02/M-05/M-07/M-08; V-11/V-12/V-16. Test past/current/future factual dates, reason/approval, preservation of valid bonus debt and payment history. Approved business rule, not a completed implementation.

#### BR-05 — requested monthly payroll preparation automation

- **Source:** Owner's clarification of payout timing and preparation workflow.
- **Requested product direction:** on the first day of each month, automatically prepare a payroll for the preceding service month. Operators then review and edit as needed, approve the final per-employee fixed-salary-plus-bonus amounts, and record payouts through the normal controlled workflow. The request does not authorize automatic approval or actual payment.
- **Initial status:** **DRAFT** is the recommended implementation default because the existing lifecycle supports editable preparation before review/approval. The Owner requested a correct preparatory status, suggesting draft; the status choice is recorded here as an implementation recommendation, not a separately selected business rule.
- **Audit baseline:** manual payroll creation exists; a monthly payroll-creation scheduler was not established by the completed audit. Do not describe this automation as already implemented.
- **Required implementation properties:** idempotent creation per intended period, no duplicate when Finance already created a run, no overwrite of human edits/approved records, period-correct salary/bonuses, and visible handling of incomplete inputs. These are implementation safeguards, not permission to guess missing compensation.
- **Priority resolved in BR-24:** manual creation at first launch; automation later. Business timezone/execution time, catch-up after a missed run and operational owner remain future automation decisions. Do not invent a deployment schedule from the request. Date flexibility under BR-01 remains even if automatic preparation runs on day 1.
- **Implementation / validation:** M-02/M-05/M-09/M-10/M-11; V-01/V-02/V-10/V-13/V-14/V-17. Add scheduler-specific tests when implementation is authorized. Documentation only; no scheduler, Codex automation or application behavior changed.

### Subsequent approved decisions — conversation record through Q-29

The current file did not retain the previously recorded BR-06–BR-13 sections. This section restores the explicit Owner answers from the conversation and records Q-12 A. These approved subparts supersede earlier unanswered labels and proposals; remaining subparts are not automatically resolved. Decisions are requirements, not evidence of implemented functionality. No application changes or new audit were performed.

#### BR-06 — Q-04 A: correction boundary

Before the first employee payment for the service month, correct the calculation through the controlled workflow. After any payment, preserve original accrual/payment history and add a separate adjustment. Example: accrued 300,000, paid 100,000, corrected entitlement 350,000 → adjustment +50,000 and remaining payable 250,000. Approval roles, closed periods, shared payroll effects, overpayment recovery and salary/bonus attribution remain open. No bonus clawback from fixed salary is authorized. M-02/M-07/M-10; V-02/V-11/V-12/V-17 must verify balances, immutable original history and no duplicate adjustments.

#### BR-07 — Q-05 A: manual absence adjustment

Use monthly fixed salary by default; an authorized operator enters a manually calculated absence-related adjustment with explanation and approval. Apply BR-06 after payment. No automatic day-based formula or deduction merely from absence status is approved. Paid/unpaid absence entitlements, attendance ownership and roles remain open. M-02/M-07/M-10; V-02/V-11/V-16 must verify the correct month, reason/approval and reconciled historical balance.

#### BR-08 — Q-06 A: AMD-only first launch

Salary and bonuses use AMD only. Reject incompatible inputs before affected calculation; no implicit conversion or relabeling of foreign-currency amounts. Existing contractual terms/history require explicit resolution rather than silent rewriting. FX and multi-currency workflows are optional future scope. N-05 remains an implementation blocker until corrected. M-03/M-10; V-03 must verify units end to end and rejection without partial records.

#### BR-09 — Q-07 A: missing KPI facts

Hold only the affected Sales bonus pending clarification; do not default to full factor, write it off or mark it paid. Fixed salary and other confirmed amounts may proceed. Apply the existing KPI scale for the original earned month once facts are available. Missing data is distinct from actual zero performance. No manual override was approved. Ownership/escalation and closed-period handling remain open. M-04/M-05/M-08/M-10; V-08/V-10/V-12/V-17 must cover missing plan/actual/result, real zero results and later settlement without duplicates or loss.

#### BR-10 — Q-08 A: no general zero-base model; Sales Probation exception in BR-23

Unsupported zero contracted fixed salary requires clarification before affected calculation; missing profile is not an approved zero salary. Do not invent a positive amount or permit unlimited bonuses through the existing cap bypass. Preserve old obligations and BR-01 partial/deferred payout flexibility. A zero payment now or a zero calculated final-settlement amount is distinct from a zero contracted base. M-02/M-06/M-08/M-10; V-01/V-09/V-16/V-17 must verify these distinctions. The later explicit Sales Probation decision BR-23 supersedes this prohibition for that population: legitimate bonuses can accrue and be paid with no fixed salary. Other zero-base models remain unapproved. The implementation must distinguish intentional Probation from missing configuration.

#### BR-11 — Q-09: fully paid product invoice

One-time Classic Sales accrual requires full payment of a qualifying product/order invoice. Domain invoices do not qualify. Installments 100,000 + 100,000 on a 210,000 invoice are insufficient; 10,000 remains due. Keep the existing full-order Classic bonus base and independent Seller/Assistant rates. No repeat entitlement on later invoices and no bypass of KPI/cap/funding/approval at payout. Subscription formulas are not changed by inference. The audit confirmed the fully-PAID trigger, not all classification/replacement cases. BR-14 now resolves the earlier first-created-versus-first-paid ambiguity. M-04/M-08/M-10; V-04/V-05/V-14.

#### BR-12 — Q-10 A: recover accrual independently

Retain the recorded client payment when bonus processing fails. Surface the exception to a responsible operator and retry separately without duplicates, using the original event and historical terms. Resolve it before approval of the affected bonus calculation. Logging alone is not recovery. Responsible role, escalation and closed-period corrections remain open. M-04/M-09/M-10; V-04/V-13/V-14/V-17 must test persisted payment, visible exception, retry and concurrent/repeated recovery.

#### BR-13 — Q-11 B: hard minimum at invoice creation

The first qualifying product invoice must be at least the combined Seller and Assistant bonus amount under the applicable model/base/rates. Equality qualifies; 10 percent was illustrative, not a universal minimum. Include both roles even for one employee. Sales and Finance cannot create/save an insufficient first product invoice, including a draft, or issue/send it; show the minimum and explanation immediately. No “continue without bonus” bypass or cumulative-small-invoice activation was selected. This supersedes the earlier draft-allowed proposal. Domain invoices are excluded. Do not silently alter existing invoices, receipts or history. The audit did not establish this exact safeguard as implemented. Rate changes between creation/payment, existing insufficient invoices and rounding details require validation/remaining policy decisions. M-04/M-08/M-10; V-04/V-05/V-15/V-17 must cover below/equal/above threshold, all creation/edit paths, both roles and invoice purpose.

#### BR-14 — Q-12 A: qualifying invoice survives unpaid duplicate removal

- **Explicit approval:** Owner selected Q-12 option A. The first fully paid qualifying invoice for the same product/order can trigger the one-time bonus if its amount covers the combined Sales bonuses and that entitlement has not already accrued. Original creation order/number does not permanently reserve eligibility.
- **Approved examples:** remove unpaid erroneous invoice 1 and pay qualifying invoice 2 → one accrual; remove unpaid erroneous invoice 2 and pay qualifying invoice 1 → one accrual. Repeat events or later paid invoices must never produce a second one-time entitlement.
- **Product boundary:** domain and unrelated additional-service invoices do not trigger the main product's bonus. First launch uses separately identified product invoices; mixed-purpose qualification and cumulative small-payment activation are not required. BR-13 minimum protection remains mandatory; invoice replacement cannot bypass it.
- **History boundary:** this rule concerns unpaid erroneous duplicates. Removal/reversal of an already paid or bonus-triggering invoice is a financial correction under M-07/BD-04, not ordinary duplicate cleanup. No destructive deletion of financial history is authorized. Preventing duplicate billing remains a separate integrity concern.
- **Evidence and dependencies:** the precise duplicate/replacement behavior was not established by the completed audit. Required dependencies are reliable product/order attribution, combined-bonus coverage and idempotent entitlement tracking per product/order rather than only per invoice. Handle legitimate Seller and Assistant entitlements, including one employee in both roles, without losing either amount.
- **Validation / acceptance:** M-04/M-08/M-09/M-10; V-04/V-05/V-13/V-14/V-17. Test both approved removal scenarios, domain/additional-service exclusion, partial payment, threshold equality, repeat and concurrent qualifying events, and paid-invoice corrections separately. Exactly one complete one-time entitlement must remain for the relevant product/order. Approval of this rule does not prove readiness or authorize implementation.

#### BR-15 — Q-13 A: partial payments settle fixed salary first

- **Explicit approval:** Owner selected Q-13 A; partial-payment allocation portion of BD-12.
- **Approved rule:** allocate each employee payment to the remaining fixed-salary obligation first, then to bonus obligations. No operator override or proportional allocation was selected. This determines allocation of an actual payout, not the earned entitlement or the amount that must be paid now.
- **Example presented:** fixed salary 300,000 AMD plus bonuses 100,000 AMD, payout 200,000 AMD → fixed salary remaining 100,000 AMD and bonuses remaining 100,000 AMD. Subsequent payments continue from the remaining balances without re-paying fixed salary already settled.
- **Boundaries / open details:** preserve BR-01 partial/deferred payment flexibility and BR-06 historical corrections. Allocation between individual bonus entries, across different service months, and reversal attribution still needs detailed validation/remaining decisions. Do not infer authority to deduct bonus clawback from fixed salary or overwrite historical payment attribution.
- **Implementation / validation:** M-06/M-07/M-10; V-09/V-11/V-12/V-17. Verify payments below/equal/above remaining fixed salary, multiple installments, no premature bonus-paid status, total component allocation equal to actual payout, and reconciled history after correction/reversal. Existing integration defects remain unresolved by documentation.

#### BR-16 — Q-14 A: one authorized operator may prepare and approve

- **Explicit approval:** Owner selected Q-14 A and specified that one Finance operator normally performs the whole workflow; a Director or the Owner may substitute and act alone. This resolves the discussed maker/checker separation and operational approval population under BD-05.
- **Approved rule:** a Finance operator, Director or Owner with the applicable financial permissions may independently prepare and approve salary changes, manual bonuses, financial corrections and payroll runs. No mandatory second person, owner-only self-approval exception, or explanation solely because the actor approves their own preparation is required.
- **Controls preserved:** retain explicit workflow approval steps where applicable, genuine authenticated actor attribution, permission checks, required reasons for the underlying correction/exception, and immutable financial history. The decision does not permit supplying another person's identity as approver or granting unrelated roles financial powers. Map Director to the actual authorized application role during implementation; do not infer rights merely from a job-title string.
- **Scope / remaining responsibilities:** this does not silently appoint owners of missing KPI data, failed-accrual escalation or external statutory processes. Unresolved correction/closed-period rules still apply even when one person can authorize the operation.
- **Implementation / validation:** M-01/M-08/M-10; V-12/V-15/V-17. Each permitted role can independently complete the authorized workflow; unauthorized roles are denied; approvals always record the actual actor; forged approver IDs cannot impersonate another employee; no unintended second-person requirement blocks these roles. No permissions or application behavior were changed in this documentation task.

#### BR-17 — Q-15 clarification: simple manual correction in the current month

- **Owner decision:** these cases are very rare. Handle increases/decreases manually in the current month through the bonus/manual-adjustment workflow. Do not reopen or edit the old closed calculation and do not build a dedicated historical-correction feature, separate screen or elaborate process for this scenario.
- **Implementation constraint:** reuse the existing manual path wherever it can faithfully record the intended adjustment. This answer is a simplicity/scope decision, not proof that negative adjustments or all historical balances currently work. Any demonstrated integrity gap requires the smallest necessary correction in a later authorized implementation task, not a new general correction subsystem.
- **Preserved evidence:** retain original accrual/payment records and the actual actor. Use the existing reason/comment to explain the correction and the original month when applicable; no new structured reference field or extra approval chain is mandated. A correction entered through a bonus UI must not silently erase an existing salary obligation or be counted twice. It is not a new performance-bonus formula or a tax classification decision.
- **Remaining boundaries:** decreases exceeding available unpaid bonus, employee departure with residual debt and bonus-cap treatment of a salary-related manual adjustment are not settled by this answer. Do not invent deductions from fixed salary or automatic debt forgiveness. BR-16 permits one authorized Finance/Director/Owner operator.
- **Validation:** M-06/M-07/M-08/M-10; V-09/V-11/V-12/V-17. Demonstrate manual increase and decrease in the current month, unchanged prior closed records, reason/actor visibility, correct payable/paid/remaining balances and no duplicate effect. Identify any unsupported signed adjustment explicitly. This supersedes proposals for mandatory period reopening or a dedicated retro-correction workflow.

#### BR-18 — Q-16 A: rare client-return cases reviewed manually

- **Owner decision:** Finance manually determines the bonus correction with an explanation; keep this rare-case process simple. No automatic proportional-return formula or dedicated complex return/bonus subsystem is requested.
- **Approved treatment:** review the reason and effect of the client return, then enter the justified adjustment through the manual path. A zero correction is permitted where the bonus entitlement is unchanged, with explanation. Do not equate every returned payment with a cancellation of the same proportion of the sale.
- **Existing protections retained:** original financial history remains visible; already paid bonus recovery follows existing future-bonus-only canon, not fixed-salary deduction. BR-16 allows Finance, Director or Owner to perform the authorized process alone. This decision does not approve a recovery schedule, automatic deduction percentage, termination debt write-off or direct alteration of old paid records.
- **Implementation scope:** reuse existing entry and reason mechanisms. Correct proven reconciliation gaps only as needed for reliable manual handling; no unsupported claim that current payment deletion already reverses bonus/KPI/ledger effects. Actual receipt/refund records and manual adjustments must reconcile without duplicate recovery.
- **Validation:** M-07/M-08/M-10; V-11/V-12/V-16/V-17. Cover a partial return changing entitlement, a returned overpayment with no bonus change, correction before and after employee payout, preservation of fixed salary, and repeated handling without a second adjustment. Residual recovery details remain open. No functionality was changed.

#### BR-19 — Q-17 A: internal payroll ledger; external accounting and bank execution

- **Explicit approval:** Owner selected Q-17 A. First-launch NBOS calculates fixed salary and bonuses and records employee payouts; statutory/accounting calculations and actual bank transfers are performed separately outside NBOS.
- **Scope:** do not make an internal tax engine or automated bank transfer integration a mandatory first-launch feature. Recorded payment status still requires the proper evidence and controls; creating an internal expense or approving payroll is not proof that a bank transfer occurred.
- **Amount semantics resolved subsequently:** Q-19 A (BR-21) defines NBOS amounts as amounts payable to the employee, after external tax calculations. External reconciliation responsibility/details remain to be agreed; no internal gross-to-net engine is implied.
- **Implementation / validation:** M-08/M-10/M-11; V-12/V-17. Demonstrate accurate internal entitlements, payout records and balances for the agreed amount basis, distinguish approval from actual payout, and reconcile an example with external accounting/payment evidence. No tax/legal compliance claim, bank execution or application change follows from this decision.
- **Subsequent question status:** Q-18 was clarified and the Owner selected manual bonus entry; see BR-20.

#### BR-20 — Q-18 A: manual Marketing and Support bonuses at first launch

- **Explicit approval:** Owner selected Q-18 A after clarification. Finance enters the agreed bonus amount and an explanation for Marketing and Support employees; the entry then participates in the normal controlled payroll/payout workflow.
- **First-launch scope:** a dedicated automatic Marketing/Support formula engine is not required for launch. Reuse the existing manual-bonus mechanism and correct any demonstrated integrity/authorization gaps rather than building new department-specific automation. This does not cancel existing documented formulas permanently or imply that those formulas are implemented.
- **Preserved rules:** AMD-only amounts under BR-08, actual-actor permissions and single-operator approval under BR-16, and accurate accrual/payment/remaining balances. Fixed salary is unchanged by this decision. Recording a bonus does not itself establish payment or waive applicable release/cap rules.
- **Remaining detail:** no new amount-setting formula, metric, rate or automatic KPI gate for these manual entries is approved. Finance records the agreed amount; the exact source of business agreement should be traceable through the existing explanation/evidence mechanism without inventing a new multi-person approval chain.
- **Implementation / validation:** M-01/M-05/M-08/M-10/M-11; V-06/V-12/V-15/V-16/V-17. Verify authorized manual entry with explanation, inclusion exactly once in the intended employee/month, multiple legitimate bonuses summed correctly, partial payment and residual reconciliation, and historical correction under BR-17. Approval is a scope decision, not proof that the full manual path is ready.

#### BR-21 — Q-19 A: employee take-home amounts

- **Explicit approval:** salary/bonus amounts recorded in NBOS represent what the employee is to receive, not gross amounts awaiting tax deductions. Tax/accounting calculations remain outside NBOS under BR-19.
- **Operational consequence:** reconcile NBOS payable balances against actual employee receipts on this same amount basis. Do not deduct tax a second time or treat externally handled taxes as unpaid salary. No tax formula, gross-up engine, tax-rate assumption or automatic alteration of existing records is authorized.
- **Existing-data boundary:** verify that existing salary/bonus inputs use the agreed basis before launch; ambiguous records require explicit reconciliation rather than relabeling. The answer does not change existing Sales/Delivery rate formulas by inference or claim statutory compliance.
- **Validation:** M-03/M-08/M-10/M-11; V-03/V-12/V-17. A stated employee entitlement of 300,000 AMD is settled by 300,000 AMD of actual employee payouts; partial receipts leave only the unpaid employee amount. Compare a full payroll example with external accounting/payment evidence.

#### BR-22 — Q-20 clarification: full chosen first month; access activation separate

- **Explicit approval:** the Owner rejected the proposed partial-month premise. On hiring/activation, select the current or future month from which fixed salary starts. Fixed salary is the full agreed monthly amount beginning on day 1 of that month. No half-month or hire-day proration is part of the present business model. Normally the selected start is next month. This supersedes earlier uncertain wording in BR-03; do not re-ask the partial-first-month formula question.
- **Example:** activate access during September and select October salary start → no September fixed-salary accrual; full October fixed salary, normally paid in November. Select September instead → full September fixed salary, normally paid in October. These illustrate the Owner's monthly rule, not a guessed physical attendance date.
- **Zero distinction:** before the selected start month, fixed-salary entitlement is zero because the agreed salary is not effective yet. This is not the unsupported permanent zero-base/bonus-only employment model in BR-10. Preserve the positive future agreed salary and effective month; do not block early access solely for lacking current fixed accrual or prematurely apply the future salary as fallback. Preserve the requirement for valid approved terms when salary actually becomes effective.
- **Bonus boundary clarified subsequently:** Q-21 A and BR-23 approve accumulation before fixed salary starts and explicitly confirm payout for Sales Probation without fixed salary. Do not apply the general BR-10 zero-base rejection to this population. KPI interpretation and exact payout/cap implementation still need explicit reconciliation with this requirement.
- **Scope preserved:** BR-04 termination, BR-07 absences, and BR-06/BR-17 historical corrections are separate. Access-activation date and salary-start month must not silently overwrite each other. Future changes to the hiring model require a new decision.
- **Validation:** M-02/M-06/M-10; V-01/V-02/V-09/V-16/V-17. Verify current-month full salary entered after day 1, access before next/farther-future salary start, no fixed accrual before that month, normal next-month payment, and no reinterpretation as an invalid permanently zero salary. Validate bonus-before-start behavior against BR-23.

#### BR-23 — Q-21 A: pre-salary bonuses and Sales Probation compensation

- **Explicit approval and business context:** bonuses may accumulate before the selected fixed-salary start month. The Owner further clarified that Sales candidates commonly make sales during Probation before being hired onto fixed salary. These sales earn payable bonuses; the candidate is not required to wait for hiring to receive them. Sales performance targets are used during Probation to determine whether the candidate proceeds to hiring. Once hired, fixed salary is added from the selected full month under BR-22.
- **Approved compensation distinction:** Sales Probation has no fixed salary but does have Sales bonus entitlement and payment. This explicitly supersedes BR-10's earlier blanket first-launch exclusion for this population. Do not require a fictitious positive salary, prematurely apply a future salary, or classify intentional Probation as accidentally missing salary data. Do not infer that a future hire or positive future salary is already guaranteed for every candidate.
- **Subsequent clarification overrides earlier full-bonus interpretation:** BR-25 requires the same KPI payout scale for Probation and active Sales employees. Full payout is conditional on the applicable KPI result, not guaranteed for every sale. No unrelated unlimited-bonus exception is approved; fixed-salary-linked cap treatment without salary remains open. Preserve rates, qualifying paid invoice, both role entitlements, currency, approval and duplicate-prevention controls.
- **KPI relationship resolved in Q-23:** probation KPI affects bonus payout using the same rules as active Sales, as well as the described hiring evaluation. The hiring-only interpretation was not approved. Period boundaries remain to be clarified; missing facts remain distinct from actual zero performance under BR-09.
- **Transition and history:** preserve bonuses already earned/paid when the candidate is hired; do not regenerate the same sale's entitlement at status change. Preserve valid owed amounts if the candidate does not proceed to hiring; the answer does not authorize erasing them. General payout flexibility remains BR-01; exact due-date/cap handling must be reconciled with the explicit probation entitlement, not silently inherited from a positive-base employee case.
- **Implementation / evidence:** the Owner reports that the system already pays these bonuses, but the completed audit did not establish this complete probation-to-hire scenario. This is an approved requirement and reported usage, not independently verified implementation. M-02/M-04/M-05/M-06/M-08/M-10; V-01/V-04/V-08/V-09/V-12/V-16/V-17.
- **Acceptance scenarios:** candidate with no fixed salary and a qualifying paid sale receives the correct bonus without fictitious salary; no sale gives no sale-based bonus; future fixed salary does not leak into the current month; hiring starts full salary in the chosen month without duplicate bonus; non-hiring preserves owed bonuses; ordinary missing compensation is still detected separately. Test below/at each KPI threshold using BR-25 and resolve the period/cap details before acceptance. No application change was made.

#### BR-24 — Q-22 B: manual payroll creation for first launch

- **Explicit approval:** Finance creates monthly payroll manually for first launch. Automatic preparation on day 1 remains a future convenience requested under BR-05, not a mandatory launch dependency.
- **Preserved behavior:** manual runs still use the correct prior service month's terms and bonuses, permit review/editing in the intended preparation state and follow approved authorization/payment controls. This choice does not add a day 1–15 gate or change entitlement timing.
- **Deferred automation:** do not build a scheduler or require decisions about its timezone, catch-up policy or execution time before manual launch. When separately implemented, preserve BR-05 idempotency, no overwrite of human edits, visible failures and no automatic payout.
- **Validation:** M-02/M-05/M-10/M-11; V-02/V-10/V-12/V-17. Finance can create and process a correct monthly run manually without duplicate financial records. No scheduler or application configuration was changed.

#### BR-25 — Q-23 clarification: common Sales KPI scale; no pre-hire Delivery bonuses

- **Explicit Owner rule:** Sales Probation and active Sales employees use the same KPI-based bonus payout approach. Probation has a sales target of **1,500,000 AMD for the probation period**. The Owner expressed uncertainty about the numerical threshold recollection and instructed use of the existing active-Sales approach; do not invent a separate probation scale or assume a hiring-only target.
- **Documented scale:** the existing Bonus/Payroll canon KPI Gate states performance >=70 percent → full bonus; >=50 and <70 percent → half bonus; <50 percent → zero payout. These are the documented scale, consistent with the Owner's recalled approach, not newly invented thresholds. Apply the gate to payout rather than silently replacing the independent per-sale rates. Validate fractional percentages and exact boundaries without a 69-to-70 gap.
- **Amount versus period:** the 1,500,000 target is approved in the stated probation context; it is not automatically every active employee's target or a universal monthly target. Exact probation duration, cross-calendar-month measurement and transition to active monthly KPI remain unspecified. Do not equate the full sales target with a bonus amount.
- **Missing facts:** BR-09 still holds affected bonuses pending missing required facts; a known below-threshold result is not missing data. Preserve source accrual/audit history even where the approved payout factor is zero. No automatic debt erasure beyond the established KPI policy is inferred.
- **Department boundary:** this Sales KPI gate is for salespeople only. The Owner explicitly stated that Development staff receive no bonuses before being hired; do not generalize Sales Probation/pre-salary eligibility to Development. Existing hired Development compensation rules remain unchanged; no Sales KPI gate is introduced for them. This narrows BR-23's earlier general pre-salary wording.
- **Approval status:** this replaces the proposed Q-23 A hiring-only interpretation; it is not an unconditional full-bonus rule. The Owner reports current operation, while the complete probation scenario remains independently unverified.
- **Validation:** M-02/M-04/M-06/M-10; V-01/V-04/V-07/V-08/V-09/V-16/V-17. Verify the same scale on active and probation Sales, the configured probation target, exact threshold boundaries, missing versus actual zero results, no fixed salary during probation, and no pre-hire Development bonus. Resolve period and zero-fixed-salary cap handling without guessing before final acceptance.

#### BR-26 — Q-24 A: no departmental allocation of fixed salary at first launch

- **Explicit approval:** record fixed salary by employee without dividing it between departments or projects for first launch. Do not require a primary-department charge or percentage allocations to process payroll.
- **Preserved traceability:** retain existing bonus links to sales/orders/work and one correct employee salary entitlement. This does not remove existing department membership or authorize duplicate salary for multiple memberships.
- **Deferred scope:** detailed departmental/project fixed-salary cost allocation and corresponding comparative reports are optional future work, requiring a separate approved allocation rule. BD-09 first-launch fixed-salary allocation scope is resolved.
- **Validation:** M-05/M-10/M-11; V-16/V-17. An employee in multiple departments receives one salary entitlement in the relevant run, total costs reconcile by employee, and source bonus links remain intact. No existing reporting or application behavior was modified.

#### BR-27 — Q-25 A: one target over the whole Probation period

- **Explicit approval:** the 1,500,000 AMD Sales target is measured over the whole Probation period, including across calendar-month boundaries, rather than resetting that target each month. Apply the common Sales KPI payout scale under BR-25.
- **Remaining detail:** actual period start/end, whether end is date-based or an operator decision, interim payout/final reconciliation and transition to active monthly KPI remain unspecified. Do not invent the duration, double count the same sales across periods, or silently use a separate monthly target.
- **Validation:** M-02/M-04/M-10; V-01/V-08/V-12/V-16/V-17. Cover probation spanning two months, correct combined sales, threshold evaluation, transition and no duplicate entitlement. Define the remaining timing before implementation acceptance.

#### BR-28 — source verification of cap behavior; decisions subsequently resolved in BR-29/30

- **Explicit business statement:** the company should have a maximum bonus of 300,000 AMD per project/order. This is distinct from a monthly salary-linked payout ceiling. The Owner did not approve the previously offered Q-26 A/B zero-salary cap choice and questioned the salary-linked rule.
- **Not yet specified:** whether the 300,000 applies per employee, to Seller plus Assistant combined, or to all employees including Delivery on an order; before/after KPI treatment; subscription periods; allocation where combined entitlements exceed the limit; treatment of existing accrued amounts. Do not implement a particular interpretation or silently alter Delivery units/rates or historical entitlements. The creation minimum in BR-13 will depend on the final combined Sales entitlement after the relevant approved order-level rule.
- **Focused source verification requested by the Owner:** `payroll-bonus-cap.constants.ts` defines default multiplier 2, allowed range 1–3; `compensation.prisma` stores `bonusCapBaseSalaryMultiplier` with default 2; `resolve-compensation-payroll-policy.ts` reads the active policy or defaults. `payroll-bonus-cap.ts` computes monthly salary-line room as base salary times multiplier minus already included bonuses, carries excess, and bypasses the cap for base <=0. `payroll-bonus-release-attach.ts` applies this cap outside the SALES-only readiness conditional, so it must not be described as solely a probation rule or solely the Sales KPI gate.
- **Illustration of code, not newly approved business policy:** base 200,000 and default multiplier 2 → monthly bonus inclusion ceiling 400,000; eligible bonus 500,000 with no already included amount → 400,000 included and 100,000 deferred. Audit N-07 still identifies integration defects in carry/paid reporting; this formula alone is not proof of correct later settlement. Actual deployed employee policy values were not queried.
- **Per-order source finding:** searched relevant API bonus/policy/Delivery paths and Prisma schemas for cap/maximum settings and searched numeric 300,000 variants across API/schema/canon. No universal 300,000 order-bonus ceiling was established. The inspected `sales-bonus-accrual-rows.ts` computes base times Seller/Assistant percentages without that clamp. Numeric occurrences in examples/test fixtures are not enforcement evidence. This is a scoped negative finding, not proof of every deployed path or configuration. No tests, DB reads/writes or financial operations were performed for this clarification.
- **Implementation consequences / acceptance:** M-04/M-06/M-08/M-10; extend V-04/V-05/V-07/V-09/V-17 after scope approval. Verify below/equal/above order ceiling, combined roles and multiple invoices, KPI order, no duplicate application, and explicit treatment of monthly cap removal/retention and old carry balances. The later Q-26/Q-27 answers resolve removal of the salary-linked cap and shared Sales order limit in BR-29/30. KPI sequencing, uncapped solo amounts and applicable subscription scope remain to be specified; no code changes were authorized.

#### BR-29 — Q-26: no monthly bonus ceiling tied to fixed salary

- **Explicit Owner rule:** there is no company rule restricting bonuses to two salaries or any salary multiple. The implemented salary-linked monthly ceiling is incorrect for the intended business model and must be removed in the authorized completion work, not retained as a configurable business default. The Owner permits payment for any number of qualifying sales in a month, subject to receipt of customer money and other approved rules.
- **Distinction:** the separate 300,000 AMD Sales order ceiling remains BR-30. KPI, eligible payment evidence, authentic approval, no duplicates and BR-01 operator-controlled partial/deferred payments remain applicable. Removing the automatic salary ceiling does not authorize payments without evidence or automatically settle unpaid balances.
- **Supersession:** this supersedes older canon/proposals in this audit plan that treated base-times-multiplier cap/carry as desired future behavior, including the need for a Probation-specific salary-cap exception. Current code and prior audit findings remain historical evidence, not approved policy. Apply the removal to the shared monthly salary-cap mechanism; do not introduce a substitute salary cap for another department. This does not extend the new Sales order ceiling to Delivery.
- **Existing records:** identify and reconcile amounts already deferred by the old mechanism without losing or double paying them. No deletion, automatic write-off or wholesale historical recalculation is authorized. Current data was not inspected; transition handling must use actual balances and preserve audit history.
- **Validation:** M-04/M-06/M-08/M-10; V-04/V-09/V-10/V-12/V-17. Test positive/zero base and multiple qualifying orders whose combined bonus exceeds two or three salaries; no salary-linked reduction or forced carry. Ten eligible orders at the maximum can produce 3,000,000 AMD combined Sales entitlement before applicable KPI effects, with the role allocation under BR-30. Reconcile old carry independently of new earnings. Documentation records required future change, not implementation.

#### BR-30 — Q-27 clarification: one 300,000 AMD Sales envelope per order

- **Explicit Owner rule:** the maximum Sales bonus is 300,000 AMD for one order. A solo salesperson receives the whole eligible Sales amount up to that ceiling. Where Seller and Assistant both participate, they share that same capped amount according to the existing applicable percentage proportions; it is not a separate 300,000 allowance for each role. This interpretation follows the Owner's explicit solo-versus-assistant explanation despite the initial phrase “per employee.”
- **Allocation implication:** if the applicable Seller/Assistant rates are 8 and 2, a capped combined bonus of 300,000 splits 240,000/60,000. The ratio follows the actual rates for that source/model, not a newly fixed universal 80/20 policy. This is an arithmetic illustration of the approved sharing rule. Same-person dual roles must not double the envelope or lose either legitimate component.
- **Approved upper-bound example:** the Owner stated that a 10,000,000 AMD order yields at most 300,000 Sales bonus, while several such orders can each earn their own bonus in the same month. Payment remains subject to the qualifying paid product invoice and other approved rules. Bonus amounts above the order ceiling are not monthly carry to be paid later.
- **Formula clarifications resolved subsequently:** BR-31 requires both roles, with the same employee assigned twice when working alone; BR-32 applies the order ceiling at accrual before employee KPI payout effects. Remaining details: fractional rounding, subscription first/recurring scope, corrections to existing uncapped accruals and tracking across invoices. Do not infer a flat 300,000 for every sale or extend the Sales ceiling to Delivery.
- **First invoice dependency:** BR-13 coverage must use the eventual approved combined Sales entitlement, with the ceiling and rate/KPI ordering explicitly defined; no hardcoded 10 percent or duplicate per-role ceiling. Protect later rate changes without silently rewriting snapshots.
- **Evidence / validation:** the scoped read found no such clamp in Sales row calculation; monthly salary cap is not an implementation of this requirement. M-04/M-06/M-08/M-10; V-04/V-05/V-06/V-09/V-13/V-17. Verify below/equal/above limit, solo and paired roles, different rate ratios, same-person dual roles, repeated invoices/events and many orders per month. No source or production data was modified.

#### BR-31 — clarification of Q-28: both Sales role fields required

- **Answer mapping:** the Owner labeled the latest answers 26/27, but their content answers the immediately preceding Q-28/Q-29. Preserve earlier Q-26/Q-27 monthly-cap and shared-order-limit decisions; this is a clarification, not their reversal.
- **Approved intended behavior:** Seller and Assistant fields must both be filled before closing the deal. If one salesperson performs both roles, assign that same employee to both fields; the employee receives both independently calculated role components within the single combined order ceiling. Do not invent automatic reassignment of an empty Assistant share or a special absent-assistant rate.
- **Evidence boundary:** the Owner stated their understanding that this validation already exists. The completed audit confirmed the intended same-person dual-role entitlement and identified N-02's persistence collision, but did not establish universal mandatory Assistant validation on every closing path. Treat the requirement as approved and existing enforcement as unverified.
- **Validation:** M-04/M-08/M-10; V-04/V-05/V-06/V-15/V-17. Missing either role prevents closing with a clear message; the same employee is allowed in both roles; two legitimate amounts are preserved below/at/above the order ceiling without duplicate payouts or unique-key loss. Test alternate closing paths. Historical incomplete assignments require explicit correction rather than guessed allocation. No application validation was changed.

#### BR-32 — clarification of Q-29: order ceiling at accrual; KPI controls payout

- **Approved sequence:** calculate the ordinary Sales bonus by the applicable independent role rates, limit the combined order accrual to 300,000 AMD, and allocate the capped amount by the applicable role proportions. Retain the resulting accrual amount in history. Employee KPI and other approved payout rules determine how much of that accrued amount is actually payable; do not reprice or erase the source accrual solely because its payout is reduced.
- **Owner explanation:** a 300,000 accrued bonus behaves like any other order bonus, such as 10,000. A poor KPI result may yield half or no payout. The order ceiling is not an employee monthly limit and does not guarantee the full amount will be paid.
- **Illustration:** one employee in both roles with a 300,000 combined capped accrual and a 50 percent payout factor receives 150,000 under that gate; a zero factor gives zero payout while the source accrual remains recorded. Where two different employees fill the roles, preserve each component and the applicable employee payout rules; do not assume identical KPI results or transfer a reduced component to the other person.
- **Distinct balances:** the gap created by a KPI reduction is not automatically a payable debt to carry to another month. Preserve the established KPI reduction/write-off policy and audit history, and distinguish it from a confirmed payable amount whose actual payment is merely deferred by Finance. Amount above the 300,000 accrual ceiling is likewise not salary-cap carry.
- **First invoice dependency:** the minimum invoice coverage uses the combined capped Sales accrual under BR-13/BR-30, not a speculative later KPI reduction. Do not reduce the required first invoice based on an employee's forecast KPI outcome.
- **Validation:** M-04/M-05/M-06/M-08/M-10; V-04/V-08/V-09/V-12/V-17. Test per-order amounts below/equal/above 300,000, factors 1/0.5/0, same versus different role holders, several orders per month, and preserved distinctions among accrued, KPI-payable, actually paid and remaining payable. Approval of formula order does not fix the source implementation.

### Recording subsequent answers

Record each selected rule separately from proposals with its BD/question IDs, answer date, exact selected behavior, applicability/effective scope, approved numerical examples if supplied, historical handling, accountable roles and remaining unanswered subparts. Link to M/V actions. Approval of a rule is not evidence that code implements it.

Only the three approved audit documents may be created or updated within the authorized documentation scope. Do not create a fourth decision file or edit product canon/application behavior without additional authorization. A dedicated section here keeps selected rules distinct from proposals.

## 8. Optional and conditional future work

| Work                                                        | Dependency and reason                                                                                | Acceptance if undertaken                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Rich department comparisons and scheduled reporting packets | Deferred under BR-26; future allocation policy needed; does not block employee-level payroll         | Totals reconcile to approved cost attribution; no duplicate salary across departments      |
| UI convenience, bulk preparation, nonessential dashboards   | After core money controls; reduce operator effort                                                    | Same authorization/invariants as single-item operations; no hidden changes to compensation |
| Automatic Marketing/Support engines                         | Deferred for first launch by BR-20; use agreed manual entries, preserve future formula requirements  | Approved metrics, rates, source facts, effective dates and reversals tested                |
| Full general policy hierarchy                               | Conditional on actual agreements and BD-10; not applicable as employee-rate overrides to Delivery v2 | Deterministic precedence and audited reasons/effective dates                               |
| Multiple currencies or explicit FX conversion               | Conditional on BD-06; an AMD-only restriction still needs enforcement                                | Reproducible currency/rate history and correct expense/report units                        |
| Statutory/net-pay processing, payslips, bank execution      | Separate scope under BD-13, with authoritative jurisdiction-specific requirements                    | Dedicated verified requirements and acceptance; not implied by gross-pay approval          |
| Automatic monthly preparation                               | Deferred beyond first launch by BR-24; requested future direction remains BR-05                      | Idempotent run creation, approved inclusion rules and owned failure handling               |

## 9. Completion criteria

The plan is complete only when applicable M actions satisfy their acceptance criteria, all required V scenarios pass in the appropriate environment, applicable decisions are recorded as approved rather than proposed, and Finance/Owner accept the documented first-launch scope.

No completion percentage, delivery estimate, production incident count or readiness date is supported by this audit. Production permission remains a separate decision after evidence review.
