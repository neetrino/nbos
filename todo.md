# Payroll, Salary, Bonus, Wallet — remaining work

## MVP status

**Finance / Wallet compensation UX (Phases 1–7) is shipped.** Canonical flow, screens, exports, and tests are documented here:

[`docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md`](docs/NBOS/02-Modules/04-Finance/12-Compensation-Roadmap-Implementation-Audit.md)

Product canon (full target behavior): `docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md`, UI spec: `docs/NBOS/05-UI-Specifications/04-Finance-Pages.md`.

Cleanup registers (what is stale vs shipped): `docs/NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md`, `docs/NBOS/02-Modules/07-My-Company/06-My-Company-Cleanup-Register.md`, `docs/NBOS/05-UI-Specifications/06-UI-Shell-Cleanup-Register.md` § B6.

Progress format: `- [ ]` not started · `- [ ] _(in progress)_` · `- [x]` done.

---

## 1. Product decisions (resolve before policy engine UI)

- [ ] **Wallet month sheet:** keep shared `EmployeeMonthCompensationSheet` (read-only) vs calmer employee-only layout/copy.
- [ ] **Current month forecast:** wallet accumulating card — earned bonuses only vs include incoming/predicted.
- [ ] **Burned KPI display:** separate negative summary line vs status on each bonus row vs both.
- [ ] **Cap / carry-over:** auto-apply in payroll now vs show as planned/advisory until policy engine ships.
- [ ] **Pay Now default:** all expenses vs dedicated payroll preset/filter as default landing.

---

## 2. Policy engine (cap, carry-over, burned KPI)

Backend + rules live in My Company policy templates; Finance executes. See `05-Bonus-and-Payroll.md` § Policy Engine.

- [ ] **Cap:** enforce pool/order/employee caps on release attach; persist capped amount and reason.
- [ ] **Carry-over:** when release not fully paid in payroll month, create/advance carry-over balance to next month (no double pay).
- [ ] **Burned KPI:** ledger line or adjustment row when KPI gate zeroes/reduces bonus (not only run-level sales KPI scale at attach).
- [ ] **Month sheet / wallet:** show cap, carry-over, and burned as explicit lines or row-level explanations (per product decision above).
- [ ] **Bonus breakdown statuses:** Incoming, Burned, Carry-over, Clawback — match canon labels in API + UI (beyond current release-type badges).
- [ ] **Tests:** cap trim, carry-over across two payroll months, burned KPI reducing included amount, idempotency on re-attach.
- [ ] **Re-audit** API vs monthly compensation model when `Compensation Profile` / policy schema changes.

---

## 3. UX gaps (canon vs current MVP)

- [ ] **Bonus pools:** employee breakdown inside each pool row/sheet (canon § Bonus pools — not only roll-up metrics).
- [ ] **Salary board:** department filter (if required for CEO/Finance parity with old board).
- [ ] **Payroll run:** Board / Calendar views for runs list (canon § Finance → Payroll — list + detail exist; board/calendar optional).
- [ ] **Wallet:** per-bonus explanations when partial / delayed / carried / burned (copy tied to policy engine data).

---

## 4. QA and ops

- [ ] **Manual visual QA** — run checklist in audit doc § Manual visual QA (Bitrix parity: salary card, bonus list, partial pay, Pay Now link).
- [ ] **Push / deploy** local `development` commits (8 ahead of origin at last MVP closure) and smoke-test in staging.

---

## 5. Resolved (no action)

- Bonus route: `/finance/bonuses` canonical; `/bonus` redirects with query preserved.
