# Finance / Payroll / Unit Economics — open work

**Status (2026-05):** MVP shipped — payroll matrix, KPI payable, UE v2 (Hierarchy, OUTSOURCE/MAINTENANCE), bonus-pools removed.

**Do not redo:** KPI in My Company only; attach by `earnedPeriod` / `payableAmount`; no payroll KPI forms; no expense plans in UE Out (planned = **bonus to pay** only).

---

## Next (do now)

### Phase 8 — Manual QA

**Payroll matrix**

1. Create run → matrix → edit release → manual bonus from gray cell
2. Partial/extra bonus, over-funding reason, reorder rows/columns, reload (layout persists)
3. Approve → expense → Pay Now → paid/remaining
4. Close run → read-only matrix

**Salary Board / KPI** 5. Month sheet: General / Bonuses / KPI; Sales shows full / payable / KPI %  
6. Delayed payout: March bonus paid in May payroll — snapshot frozen

**Unit Economics** 7. Hierarchy: expand project → product → order; drill-down all tabs  
8. Bonus breakdown from order detail (not full pools list)  
9. `/finance/bonus-pools` → redirect only

---

## Optional (after QA)

| Item                      | Notes                                       |
| ------------------------- | ------------------------------------------- |
| Layout-change audit       | Matrix row/column reorder → audit log       |
| Approval validation edges | Extra/over-funding edge cases               |
| Bonus recipient history   | Full timeline in sheet (now last N)         |
| Web tests                 | Matrix render, cell edit, layout restore    |
| Docs sync                 | `05-Bonus-and-Payroll.md`, cleanup register |
| Closed units visibility   | Hide after all bonuses paid? (rule TBD)     |

---

## Later (separate slices — not MVP)

- **Policy engine:** cap / carry / burned KPI automation; per-template rates in My Company
- **UE perf:** materialized read table vs live aggregation
- **Product rules:** over-funding approver; shared matrix layout; employee KPI override

**Ops only:** `POST /api/scheduler/sales-kpi-month-close`, `POST /api/scheduler/sales-kpi-backfill-all`
