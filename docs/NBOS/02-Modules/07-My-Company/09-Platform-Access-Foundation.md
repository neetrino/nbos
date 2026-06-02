# Platform Access Foundation

> Платформенная модель access levels для Project/Product-scoped данных. Credentials использует ее первым, но модель не является credentials-only.

**Дата:** 2026-06-02  
**Статус:** accepted direction; implementation planned before final Credentials access implementation.

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

## Future Module Contracts

### Drive

Drive should later reuse ProjectTeamMember/ProductTeamMember for:

- project drive;
- product drive;
- manual file/folder overrides.

### Finance

Finance should combine project/product access with finance-specific role gates.

Example: a seller may see only finance data related to their sales/project context, while Finance roles get broader finance operations access.

### Project Hub / Tasks

Project Hub and Tasks should consume ProjectTeamMember/ProductTeamMember rather than inferring access from loose product fields forever.

---

## Cleanup Notes

Older docs may still say:

- `Department credentials`;
- `Project Team = all project-related people`;
- `Credentials (project)` without separating Product Team and Project Team.

Those should be treated as legacy vocabulary until updated.
