# Finance workflow boards — inventory

> Phase 6 tracking for kanban/list standard rollout.

References: [`11-Finance-Stage-Gate-and-Board-UX-Standard.md`](11-Finance-Stage-Gate-and-Board-UX-Standard.md)

## Surfaces (web)

| Surface                | Path                        | Active scope                                             | Closed / terminal                                       | Board + List             |
| ---------------------- | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | ------------------------ |
| **Expenses (active)**  | `/finance/expenses`         | `activeBoard=true` → board columns `PLANNED` … `ON_HOLD` | —                                                       | Yes                      |
| **Expenses (closed)**  | `/finance/expenses/closed`  | —                                                        | `closedBoard=true` → `PAID`, `CANCELLED` kanban columns | Yes (2026-05)            |
| **Expenses (backlog)** | `/finance/expenses/backlog` | `BACKLOG` only                                           | —                                                       | List only                |
| **Invoices**           | Finance → Invoices          | `moneyStatus` kanban                                     | `PAID`, `CANCELLED` on same board                       | Kanban (list TBD parity) |
| **Subscriptions**      | Finance module              | Grid/list-first                                          | Canon TBD                                               | List-first               |

## Stage-gate UX

- **Today:** payment rollup, amount guards, payroll sync — mostly on detail/API.
- **Target:** sheet + field highlights per platform standard; no duplicate modal forms.

## API query flags

| Flag               | When                              | Scope                      |
| ------------------ | --------------------------------- | -------------------------- |
| `activeBoard=true` | Active expense route, no `status` | Excludes `PAID`, `BACKLOG` |
| `closedBoard=true` | Closed expense route, no `status` | `PAID`, `CANCELLED` only   |
