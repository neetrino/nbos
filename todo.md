# Payroll, Salary, Bonus, Wallet — remaining work

## MVP status

**Finance / Wallet compensation UX (Phases 1–7) is shipped.** Canonical flow, screens, exports, and tests are documented here:

[`docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md`](docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md)

Product canon (full target behavior): `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md`, UI spec: `docs/NBOS/05-UI-Specifications/04-Finance-Pages.md`.

Cleanup registers (what is stale vs shipped): `docs/NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md`, `docs/NBOS/02-Modules/07-My-Company/06-My-Company-Cleanup-Register.md`, `docs/NBOS/05-UI-Specifications/06-UI-Shell-Cleanup-Register.md` § B6.

Progress format: `- [ ]` not started · `- [ ] _(in progress)_` · `- [x]` done.

---

## 1. Bonus pool target UX and product decisions

Goal: `/finance/bonus-pools` must become the control center for product bonus money:
how much client money came in, how much bonus was planned, who should receive it,
how much was released/paid, what is still underfunded, and what KPI/cap rules changed.

- [ ] **Pool meaning:** keep Product / Extension as the main pool scope; Project is only the wrapper, Order is the funding anchor.
- [ ] **Pool fill indicators:** define labels and colors for Empty, Partially Funded, Ready, Overfunded, Closed.
- [ ] **Burned KPI display:** show burned/reduced bonus as a separate negative line and row badge.
- [ ] **Cap / carry-over:** auto-apply in payroll vs show as suggested until policy engine ships.
- [ ] **Current month forecast:** wallet card should include earned-only vs incoming/predicted bonus.
- [ ] **Pay Now default:** all expenses vs dedicated payroll preset/filter as default landing.

---

## 2. Bonus pool data and API foundation

Backend must expose pool data as product-level rollups plus employee-level breakdowns.

- [ ] **Pool rollup API:** return Product / Extension, Orders, Project, received, planned, released, paid, remaining, available funding, over funding, fill percent, and status.
- [ ] **Multi-order pools:** aggregate all orders under the same Product / Extension; do not rely only on one `anchorOrderId`.
- [ ] **Employee breakdown API:** add endpoint for pool lines with employee, role, bonus type, planned, KPI allowed, released, included in payroll, paid, remaining, burned, carry-over, and status.
- [ ] **Ledger traceability:** show which payments/orders funded the pool and which releases consumed it.
- [ ] **Auto release suggestions:** after Product / Extension done or new client payment, suggest proportional release by employee when funding is partial.
- [ ] **Manual override audit:** persist reason/approval for early release, extra bonus, over funding, and cap override.
- [ ] **Tests:** rollup across multiple orders, partial funding, over funding, closed pool, empty pool, and employee breakdown totals.

---

## 3. Finance screens and views for bonus control

UI must make the pool understandable without opening many pages.

- [ ] **Pools list view:** table by Product / Extension with Order(s), Project, Received, Planned, Released, Paid, Remaining, Available, Fill %, and Status.
- [ ] **Pools board view:** lanes by funding state: Empty / Partial / Ready / Overfunded / Closed; cards show main money indicators and employee count.
- [ ] **By project view:** group project -> products/extensions -> employee summary, so Finance sees which projects still have unpaid bonus obligations.
- [ ] **Pool detail sheet:** hero summary with beautiful indicators: received money, planned bonus total, released, paid, remaining, available funding, over funding, and fill bar.
- [ ] **Employee breakdown table:** inside pool sheet show Seller/PM/Developer/Designer rows with planned, KPI %, allowed, released, paid, remaining, burned, and next suggested release.
- [ ] **Funding timeline:** in pool sheet show payments in, releases out, payroll inclusion, paid date, and manual overrides.
- [ ] **Risk indicators:** badges for Underfunded, KPI reduced, Carry-over, Early release, Extra bonus, Over funding.
- [ ] **CSV/export:** export rollups and employee breakdown with the same columns Finance sees.

---

## 4. Policy engine (employee bonus, KPI, cap, carry-over, burned)

Backend + rules live in My Company policy templates; Finance executes. See `05-Bonus-and-Payroll.md` § Policy Engine.

- [ ] **Bonus Policy Templates:** implement safe templates for sales, delivery, marketing, support, and manual bonuses.
- [ ] **KPI Policy Templates:** configure thresholds such as `<50% = 0%`, `50-69% = 50%`, `>=70% = 100%`, with role-specific variants.
- [ ] **Compensation Profile link:** employee profile must define active bonus policy, KPI policy, currency, and effective dates.
- [ ] **Employee-level KPI:** calculate seller/developer/PM bonus eligibility per employee, not only one payroll-run sales KPI.
- [ ] **Burned KPI:** persist when planned bonus is reduced by KPI; show amount and reason in Finance and Wallet.
- [ ] **Cap:** enforce pool/order/employee caps on release attach; persist capped amount and reason.
- [ ] **Carry-over:** when release not fully paid in payroll month, create/advance carry-over balance to next month (no double pay).
- [ ] **Bonus breakdown statuses:** Incoming, Burned, Carry-over, Clawback — match canon labels in API + UI (beyond current release-type badges).
- [ ] **Idempotency:** recalculating policy must not double-create bonus entries, releases, burned rows, or carry-over.
- [ ] **Tests:** cap trim, carry-over across two payroll months, burned KPI reducing included amount, idempotency on re-attach.
- [ ] **Re-audit** API vs monthly compensation model when `Compensation Profile` / policy schema changes.

---

## 5. Payroll and wallet integration

- [ ] **Payroll attach:** attach approved releases using KPI/cap/carry-over amounts, not just raw release amount.
- [ ] **Salary month sheet:** show planned, released, KPI burned, carry-over, paid, and remaining by bonus source.
- [ ] **Employee wallet:** show per-bonus explanations when partial, delayed, carried, burned, paid, or clawed back.
- [ ] **Pay Now:** make payroll-related expenses easy to filter and pay from salary/bonus context.
- [ ] **Notifications:** employee gets clear wallet hints when bonus is released, reduced by KPI, carried, or paid.

---

## 6. Other UX gaps (canon vs current MVP)

- [ ] **Salary board:** department filter (if required for CEO/Finance parity with old board).
- [ ] **Payroll run:** Board / Calendar views for runs list (canon § Finance → Payroll — list + detail exist; board/calendar optional).

---

## 7. QA and ops

- [ ] **Manual visual QA** — run checklist in audit doc § Manual visual QA (Bitrix parity: salary card, bonus list, partial pay, Pay Now link).
- [ ] **Push / deploy** local `development` commits (8 ahead of origin at last MVP closure) and smoke-test in staging.

---

## 8. Resolved (no action)

- Bonus route: `/finance/bonuses` canonical; `/bonus` redirects with query preserved.
