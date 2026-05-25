# Support ticket board lifecycle

> Active vs closed scope for `/support` kanban and list (NBOS kanban standard).

## Active pipeline

| Status        | Label       |
| ------------- | ----------- |
| `NEW`         | New         |
| `TRIAGED`     | Triaged     |
| `ASSIGNED`    | Assigned    |
| `IN_PROGRESS` | In Progress |

## Terminal outcomes (closed scope)

| Status     | Label    |
| ---------- | -------- |
| `RESOLVED` | Resolved |
| `CLOSED`   | Closed   |

## UI

- Filter **Status** → `Active` (default) | `All statuses` | `Closed`.
- When a specific **Stage** (`status`) filter is set, board scope is not applied (same pattern as CRM Deals).
- Closed scope shows `SupportWorkflowScopeBanner` and the same board/list components as active.

Reference: [`00-Support-Tasks-Board-UX-Roadmap.md`](00-Support-Tasks-Board-UX-Roadmap.md).
