# Platform Access Foundation

> Платформенная модель access levels для Project/Product-scoped данных. Credentials использует ее первым, но модель не является credentials-only.

**Дата:** 2026-06-02  
**Статус:** Phase 1 implemented (schema, team APIs, access policies settings, project/product participants UI). Credentials enforcement — Phase 2 after Category vs Type decision.

---

## Назначение

NBOS нужен общий access foundation, потому что доступы к Credentials, Drive, Finance, Project Hub, Tasks и будущим модулям должны опираться на одну и ту же модель Project/Product participation.

Главная проблема старой формулировки: `Department` не описывает клиентские/project credentials. В реальной работе эти записи относятся к проекту, продукту и команде, а не ко всему org department.

---

## Core Layers

### 1. Role Access Levels

Default access by role/seat.

Примеры:

- Tech Specialist: project/product assigned access;
- PM: assigned project access;
- Head of Delivery: broader project access;
- Intern / Junior: no automatic sensitive access;
- CEO / Founder: global owner access.

### 2. Personal Access Levels

Employee-level override above or below role default.

Используется, когда конкретный сотрудник должен получить уровень выше/ниже своей роли без изменения всей role policy.

### 3. Manual Override

Explicit access to one concrete resource.

Для Credentials manual override в Sheet поддерживает только:

- `View`;
- `Edit`.

Manual override не выдает delete/admin. Delete/Admin остается high-level RBAC/platform permission.

### ResourceAccessGrant reuse contract (Slice D)

Единая таблица `ResourceAccessGrant` (`resource_type`, `resource_id`, `employee_id`, `level`, `expires_at`, `revoked_at`, `reason`).

Константы: `@nbos/shared` → `RESOURCE_GRANT_RESOURCE_TYPE`, `RESOURCE_GRANT_RESOURCE_TYPES`.

| `resource_type`    | Module      | Manual UI           | Levels (platform) | Enforcement notes                                                               |
| ------------------ | ----------- | ------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `credential`       | Credentials | Sheet Manual Access | `VIEW`, `EDIT`    | Row filter + sheet; legacy `allowedEmployees` backfilled                        |
| `drive_file_asset` | Drive       | File Share dialog   | `VIEW`, `EDIT`    | Dual-write from `FileAssetGrant`; permission in `reason` (`drive_permission:*`) |
| `drive_folder`     | Drive       | Folder Share dialog | `VIEW`, `EDIT`    | Folder grant opens folder; files in subtree via `drive-folder-grant-inherit.ts` |
| `finance_*`        | Finance     | — (planned)         | `VIEW`, `EDIT`    | Not shipped; row access = RBAC + participation graph today                      |

Rules:

- Manual grant **never** replaces module RBAC gate (user still needs `*_VIEW` / action permission).
- `level` = `VIEW` | `EDIT` only at platform layer; module-specific actions (EXPORT, SHARE, …) stored in Drive `reason` or legacy grant tables until unified.
- Revoke sets `revoked_at`; expired grants ignored in `activeResourceAccessGrantWhere`.
- Audit: grant create/update/revoke per module (Credentials shipped; Drive via grant APIs).

---

## Project / Product Team Model

### ProjectTeamMember

Project-level participant.

Project может иметь несколько admins. Project admins управляют:

- project settings;
- participants;
- project-level access;
- project-wide operational context.

Project Team выше Product Team. Сотрудника можно поднять в Project Team, если он должен получить project-level access шире одного продукта.

### ProductTeamMember

Product-level participant.

Product Team получает доступ только к своему product context.

Правило:

```text
Product team membership does not automatically grant project-level access to all products.
```

Если в project есть Web product и App product, участник Web product не получает App credentials/files/finance автоматически.

---

## Action Levels

Base actions:

| Level          | Meaning                                                        |
| -------------- | -------------------------------------------------------------- |
| `View`         | can see/use/read resource according to module rules            |
| `Edit`         | can change resource fields/settings allowed for this module    |
| `Delete/Admin` | high-level platform/RBAC permission, not manual resource level |

For Credentials:

- `View` means can open credential and use/copy/reveal allowed secret fields according to step-up/audit rules.
- `Edit` means can update credential metadata/secret fields according to module rules.
- Delete/archive/permanent delete are not assigned in the credential card.

---

## Credentials Contract

Credentials scopes:

| Scope      | Meaning                                                     |
| ---------- | ----------------------------------------------------------- |
| `My`       | personal work credentials; owner + global vault owners      |
| `Team`     | low-risk shared company/team credentials; role-based access |
| `Project`  | client/project/product credentials                          |
| `Secret`   | sensitive credentials with manual selected access           |
| `Archived` | archived credentials                                        |

### Project Credentials

Project credential access is resolved from:

1. Role Access Level;
2. Personal Access Level;
3. ProjectTeamMember / ProductTeamMember;
4. Manual Override;
5. global owner/CEO policy.

Rules:

- Product-linked credential: product team can access only that product by level; project team can access by project-level policy.
- Project-only credential: project team can access by level; product team does not get it automatically.
- Manual credential override can grant `View` or `Edit` to one employee for that credential only.

### Manual Access UI

Credential Sheet Manual Access block shows only manually added employees.

Do not list every inherited user from role/RBAC/project/product team policy.

Inherited access may be shown as a short summary:

```text
Inherited: Product team + Role access
```

---

## Module integration contracts (Phase 2)

Shared Prisma participation filters live in `apps/api/src/modules/platform-access/platform-team-graph.where.ts`:

- `buildProjectParticipationWhere` — `ProjectTeamMember` + legacy delivery/sales graph;
- `buildProductParticipationWhere` — `ProductTeamMember` + legacy product FK slots;
- `buildDealParticipationWhere` — seller/PM deal fields (used inside project graph).

### Drive

**Runtime (partial):** scoped Drive entity context and inherited file links use the shared participation filters for `PROJECT`, `PRODUCT`, finance-linked entities (`INVOICE`, `PAYMENT`, `EXPENSE`), and `TASK` (assignees **or** project team).

**Runtime (partial):** `FileAssetGrant` create/update/revoke dual-writes `ResourceAccessGrant` with `resourceType=drive_file_asset`; file list/action access reads both grant stores (`drive-resource-access-grant.sync.ts`).

**Runtime (partial):** folder-level `ResourceAccessGrant` (`drive_folder`) with folder→file inherited access for active `DriveFolderItem` placements in the granted subtree (`drive-folder-grant-inherit.ts`, merged in `buildDriveExplicitFileGrantWhere`).

**Runtime (partial):** effective `driveScope` merges RBAC `DRIVE_VIEW` ceiling with Settings role/personal policy for family `DRIVE` (`drive-effective-scope.ts`, `DriveAccessContextService`).

**Still backlog:**

- inherited multi-link confidentiality edge cases (see Drive permissions canon).

### Finance

Finance row access = **RBAC module scopes** (`FINANCE_*` permissions) **plus** project/product participation when data is project-scoped.

| Context                  | Rule                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Global finance ops       | Role with `FINANCE_*` `ALL` / department scope                                                                        |
| Seller on a deal         | `buildDealParticipationWhere` on invoice order/deal graph (`finance-deal-participation.where.ts`; role slug `seller`) |
| PM / delivery on project | `buildProjectParticipationWhere` on invoice/payment/expense `projectId`                                               |
| Manual override          | Future `ResourceAccessGrant` on finance document (not shipped)                                                        |

Portfolio/client views already mask sections via `portfolio-access-mask.ts`.

**Runtime (partial):** `GET /finance/invoices`, `/finance/payments`, `/finance/subscriptions` (+ grid), and `GET /expenses` list/stats apply `finance-scoped-access` + `finance-module-participation.where` when module `*_VIEW` ≠ `ALL`.

### Project Hub / Tasks

**Runtime (partial):** Drive `TASK` context accepts project team membership when the user is not a direct assignee/observer.

**UI:** `ProjectParticipantsSection` / `ProductParticipantsSection` are source of truth for team edits; APIs sync legacy FKs via `ProductTeamSyncService`.

**Runtime (partial):** `GET /tasks?projectId=` asserts viewer project participation via `assertProjectTasksAccessible` when `TASKS_VIEW` ≠ `ALL`.

**Runtime (partial):** `GET /tasks?workspaceId=` gates via `assertWorkSpaceTasksAccessible`; workspace-only lists without `projectId` apply `buildTasksParticipationWhere` when `TASKS_VIEW` ≠ `ALL`.

**Runtime (partial):** `GET /tasks/:id` and task mutations call `assertTaskAccessible` with the same participation graph.

---

## Cleanup Notes

Older docs may still say:

- `Department credentials`;
- `Project Team = all project-related people`;
- `Credentials (project)` without separating Product Team and Project Team.

Those should be treated as legacy vocabulary until updated.
