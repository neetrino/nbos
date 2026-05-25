# Tasks board lifecycle

> Active vs closed scope for `/tasks` and Work Space runtime boards.

## Active pipeline

| Status        | Kanban column |
| ------------- | ------------- |
| `OPEN`, `NEW` | Open          |
| `IN_PROGRESS` | In Progress   |
| `REVIEW`      | Review        |
| `ON_HOLD`     | On hold       |

## Terminal (closed scope)

| Status              | Kanban column |
| ------------------- | ------------- |
| `COMPLETED`, `DONE` | Completed     |

Deadline board: **Completed** column maps to terminal tasks; hidden in Active scope.

## UI

- Filter **Status** → `Active` (default) | `All statuses` | `Closed`.
- Explicit **Stage** filter overrides board scope (same as CRM).
- Views: Kanban, Deadline, My Plan, List — scope applies to Kanban, Deadline, and List.

Reference: [`00-Support-Tasks-Board-UX-Roadmap.md`](00-Support-Tasks-Board-UX-Roadmap.md).
