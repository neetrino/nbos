# Permissions / RBAC

> NBOS Settings / Admin - технические права доступа, роли и scopes.

## Назначение

`Permissions / RBAC` отвечает за то, что пользователь может делать в системе.

Важно разделять:

```text
Business Seat / Position - кто человек в компании.
Permission Role - какие действия ему разрешены в платформе.
```

Пример:

```text
Employee: Anna
Seat: Seller
Permission Role: Sales Manager
```

Seat живёт в `My Company`. Permission Role живёт в `Settings / Admin`.

## Core entities

```text
Permission Role
  -> Role Permission
    -> Permission
      -> Module
      -> Action
      -> Scope
```

### Permission Role

Техническая роль:

- Owner;
- Admin;
- Finance Admin;
- Sales Manager;
- Project Manager;
- Developer;
- Support Agent;
- Viewer.

### Permission

Конкретное действие:

```text
crm.deals.view
crm.deals.edit
finance.invoices.approve
settings.system_lists.edit
credentials.vault.view_metadata
credentials.vault.reveal_secret
```

### Scope

Scope определяет границу доступа:

| Scope        | Значение             |
| ------------ | -------------------- |
| `NONE`       | Нет доступа          |
| `OWN`        | Только свои записи   |
| `DEPARTMENT` | Записи своего отдела |
| `ALL`        | Все записи           |

## Правило entity-level enforcement

Проверить только наличие permission недостаточно.

Нужно проверять:

```text
1. Есть ли permission?
2. Какой scope?
3. Относится ли конкретная запись к этому scope?
```

Пример:

```text
Seller может видеть свои Deals.
Head of Sales может видеть Deals отдела.
Owner может видеть все Deals.
```

## System roles

Некоторые роли являются системными:

- нельзя удалить;
- нельзя сломать базовые permissions;
- изменение требует дополнительного подтверждения;
- изменение пишется в audit log.

## Role editing UX

Экран `Permissions / RBAC`:

- список ролей слева;
- matrix permissions справа;
- фильтр по модулю;
- actions: view/add/edit/delete/approve/export;
- scope selector на каждое право;
- system role badge;
- affected users preview;
- audit tab;
- change reason для рискованных изменений.

## Safe change process

Перед сохранением изменения роли система показывает:

- сколько пользователей затронуто;
- какие модули изменятся;
- какие permissions добавлены;
- какие permissions удалены;
- есть ли risky permissions.

Risky permissions:

- finance approvals;
- payroll changes;
- credentials reveal;
- settings admin;
- integration settings;
- audit export/delete;
- impersonation, если когда-нибудь появится.

## Связь с My Company

`My Company` может назначать default permission role на seat:

```text
Seat: Seller -> default Permission Role: Sales Manager
Seat: Finance Director -> default Permission Role: Finance Admin
```

Но фактическое назначение доступа должно быть явно видно в employee profile.

Если сотрудник занимает несколько seats, система должна показывать:

- роли от каждого seat;
- manual overrides;
- итоговый effective access.

## Audit requirements

В audit обязательно пишутся:

- создание роли;
- изменение permissions;
- изменение scope;
- назначение роли пользователю;
- снятие роли;
- изменение system role;
- попытка действия без доступа.

## Cleanup hints

Если текущая реализация только подставляет `request.permissionScope`, нужно добавить:

- entity-level scope enforcement;
- affected users preview;
- audit changes;
- risky permission confirmations;
- separation of business role and permission role;
- explicit permission keys instead of loose strings where possible.
