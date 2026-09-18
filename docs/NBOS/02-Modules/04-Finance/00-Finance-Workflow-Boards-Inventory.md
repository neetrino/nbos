# Finance workflow boards — inventory

> Phase 6 tracking for kanban/list standard rollout.

References: [`11-Finance-Stage-Gate-and-Board-UX-Standard.md`](11-Finance-Stage-Gate-and-Board-UX-Standard.md)

## Surfaces (web)

| Surface                | Path                        | Active scope                                                   | Closed / terminal                                                                                         | Board + List             |
| ---------------------- | --------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------ |
| **Expenses (Pay now)** | `/finance/expenses`         | Lifecycle `Active`: `activeBoard=true` → `PLANNED` … `ON_HOLD` | Lifecycle `Closed` / `All` on the same page (`closedBoard` / `lifecycleBoard`). `/closed` redirects here. | Yes                      |
| **Expenses (backlog)** | `/finance/expenses/backlog` | `BACKLOG` only                                                 | —                                                                                                         | List only                |
| **Invoices**           | Finance → Invoices          | `moneyStatus` kanban                                           | `PAID`, `CANCELLED` on same board                                                                         | Kanban (list TBD parity) |
| **Bonus board**        | `/finance/bonuses`          | Incoming / In Progress / Active (simplified kanban)            | `PAID`, `CLAWBACK` via **Closed** scope filter                                                            | Board + List (2026-05)   |
| **Subscriptions**      | Finance module              | Grid/list-first                                                | Canon TBD                                                                                                 | List-first               |

## Stage-gate UX

- **Today:** payment rollup, amount guards, payroll sync — mostly on detail/API.
- **Target:** sheet + field highlights per platform standard; no duplicate modal forms.

## API query flags

| Flag                  | When                        | Scope                                   |
| --------------------- | --------------------------- | --------------------------------------- |
| `activeBoard=true`    | Pay now Active, no `status` | Excludes `PAID`, `BACKLOG`, `CANCELLED` |
| `closedBoard=true`    | Pay now Closed, no `status` | `PAID`, `CANCELLED` only                |
| `lifecycleBoard=true` | Pay now All, no `status`    | Excludes `BACKLOG` only                 |
| (no board flag)       | Full journal / Product All  | All statuses including `BACKLOG`        |

Precedence when `status` is omitted: `closedBoard` > `activeBoard` > `lifecycleBoard`. Product Finance Active reuses `activeBoard` (`CANCELLED` is Closed, not Active). Product Finance All sends no board flag.
