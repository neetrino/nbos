# Finance — stage-gate and board UX standard

> Aligns Invoice, Expense, and related finance workflow surfaces with platform standards.

References:

- [`../../01-Platform-Overview/04-Stage-Gate-UX-and-Validation-Standard.md`](../../01-Platform-Overview/04-Stage-Gate-UX-and-Validation-Standard.md)
- [`../../05-UI-Specifications/09-Kanban-Board-and-List-Standard.md`](../../05-UI-Specifications/09-Kanban-Board-and-List-Standard.md)
- Inventory: [`00-Finance-Workflow-Boards-Inventory.md`](00-Finance-Workflow-Boards-Inventory.md)

---

## Lifecycle model (by surface)

| Surface                                 | Active scope                                                                     | Terminal / off-board                                                                           | Stage-gate today                                                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expense Board** (`/finance/expenses`) | `PLANNED` … `ON_HOLD` columns; API `activeBoard=true` excludes `PAID`, `BACKLOG` | **Closed** route: `PAID`, `CANCELLED` (`closedBoard=true`). **Backlog** route: `BACKLOG` only. | Payment rollup + amount guards on detail; no kanban drag gates yet. Blockers → **detail sheet + field highlights** when gates are added.                                      |
| **Invoices**                            | `moneyStatus` columns on one board (`NEW` … `ON_HOLD`); default **Active** scope | `PAID`, `CANCELLED` via **Closed** filter on the same page (not a separate URL).               | Kanban money-status move: local pre-check + invoice detail sheet field highlights (`payments` / `moneyStatus`); API `assertManualMoneyStatusAllowed` remains final authority. |
| **Subscriptions**                       | Grid/list-first                                                                  | Renewal/cancel outcomes in canon                                                               | TBD                                                                                                                                                                           |

---

## Board / list UX

- **Expenses — active:** `Board` / `List` toggle on `/finance/expenses` (default board).
- **Expenses — closed:** `/finance/expenses/closed` uses the **same** `ExpenseKanbanCard` and `ExpensesTableSection` as active; **Board / List** toggle enabled; closed kanban columns: **Paid**, **Cancelled** (288px column width per kanban standard).
- **Expenses — backlog:** list-only (deferred queue; not a lifecycle board).
- **Invoices:** kanban + list on one page; **Active / All statuses / Closed** scope (terminal columns only in Closed).

Scope hint banner on closed expense view explains terminal-only scope (parity with CRM `CrmPipelineScopeBanner`).

---

## Stage-gate rules (when implemented)

1. **API is final authority** for payment totals, payroll links, and ledger sync.
2. **Local pre-check** only where list/detail payload includes enough fields (same pattern as CRM Deals / Delivery).
3. **No duplicate modal forms** for blockers — open expense/invoice detail sheet and highlight fields (`stage-gate-highlight` helpers).
4. Do not reintroduce amber `StageGateBlockerPanel` on finance boards.

---

## Module canon updates

- Expense workflow columns: [`04-Expenses.md`](04-Expenses.md) (board vs closed vs backlog).
- Invoices money status: [`02-Invoices-and-Payments.md`](02-Invoices-and-Payments.md).
