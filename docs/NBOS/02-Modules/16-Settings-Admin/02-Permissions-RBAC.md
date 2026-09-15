# Permissions / RBAC

> NBOS Settings / Admin - технические права доступа, роли и scopes.

## Назначение

`Permissions / RBAC` отвечает за то, что пользователь может делать в системе.

Этот документ описывает **technical permissions**: action permissions, permission roles and technical scopes. Он не является source of truth для Project/Product team membership и manual resource overrides.

Project/Product access foundation живет в:

- `../07-My-Company/09-Platform-Access-Foundation.md`

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

Техническая роль (операционный RBAC). **Platform Owner / Founder is not a permission role** — see `03-Platform-Owner-Security-Architecture.md`. Legacy slug `owner` is `assignable=false` and must never grant vault bypass.

- Owner (legacy, not assignable);
- CEO;
- Admin;
- Finance Admin;
- Sales Manager;
- Seller Assistant (тот же technical permission set, что у Seller);
- Project Manager;
- Developer Backend;
- Developer Frontend (тот же technical permission set, что у бывшего Developer / Delivery User);
- Support Agent;
- Viewer.

### Permission

Конкретное действие:

```text
crm.deals.view
crm.deals.edit
crm.call_recordings.play
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

Эти technical scopes описывают общий RBAC уровень. Для project/product-scoped resources требуется entity-level foundation:

## Settings modules (2026-09)

`Settings / Admin` больше не использует `COMPANY`. `COMPANY` остаётся за `My Company` (departments, employees, seats, KPI/bonus/compensation). Платформенная админка живёт в отдельных модулях, поэтому Finance Director больше не получает admin-доступ «в подарок» вместе с правами на сотрудников и зарплаты.

| Модуль               | Покрывает                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SETTINGS`           | General, Appearance, System Lists, Module Settings, Integrations, Security, Feature Flags, Trash inventory |
| `SETTINGS_RBAC`      | Permission roles, permission matrix, Role/Personal access levels (Platform Access Foundation)              |
| `SETTINGS_SCHEDULER` | Каталог платформенных cron jobs: enable, disable, run now                                                  |
| `AUDIT_LOGS`         | Audit Log (без изменений)                                                                                  |

Правила:

- `SETTINGS.VIEW` — входной билет в хаб `/settings` и во все секции без собственного модуля.
- Секция со своим модулем открывается по своему праву, без `SETTINGS.VIEW`: `/settings/audit-log` — по `AUDIT_LOGS VIEW`, `/settings/roles` и `/settings/access-policies` — по `SETTINGS_RBAC VIEW`, `/settings/scheduler` — по `SETTINGS_SCHEDULER VIEW`. Так Finance Director по матрице читает Audit Log и не видит остальную админку; на хабе ему показывается только эта плитка.
- `SETTINGS.DELETE` — только деструктивные платформенные действия (retention purge), не удаление списков.
- По умолчанию все четыре action выданы **только** Platform Owner / Founder (legacy `owner`) и CEO. Остальные роли начинают с `NONE` и получают доступ явно через Settings → Permissions / RBAC.
- Матрица в UI строится из `GET /permissions`, поэтому новые модули появляются в ней автоматически.

Одно сознательное исключение: `GET /roles` остаётся на `COMPANY VIEW`, потому что список ролей нужен формам сотрудников и приглашений в `My Company`. Он возвращает полные строки роли (slug, level, флаги, счётчик сотрудников), но не права: начинка роли (`GET /roles/:id`) и каталог прав (`GET /permissions`) закрыты `SETTINGS_RBAC VIEW`, поэтому scope и матрица по `COMPANY VIEW` недоступны.

Весь контроллер WhatsApp-шлюза (`GET` / `PUT` / `POST test` / `DELETE`, а также `GET /chats` и `GET /groups`) требует `SETTINGS EDIT`. `chats` / `groups` отдают company-wide directory, включая личные чаты, и используются только листалкой в Settings → Integrations. Привязка чата к сделке и к продукту идёт через собственные scoped-эндпоинты (`/crm/deals/:id/whatsapp-group/available-groups`, `/projects/products/:productId/whatsapp/available-groups`), поэтому расширять эти два на CRM-роли нельзя.

### Route-level enforcement

Скрытие пункта в сайдбаре не является защитой. Каждый маршрут `/settings/*` перечислен в web route registry (`apps/web/src/lib/navigation/route-permissions.ts`) и проверяется `ModuleAccessGate` по URL, включая страницы без ссылки в меню (`access-policies`, `trash-inventory`). Неперечисленный подпуть наследует гейт `/settings` (`SETTINGS VIEW`) через prefix-матч, то есть новая страница по умолчанию закрыта, а не открыта. Плитки на хабе фильтруются тем же реестром, поэтому карточка не показывается, если страница откажет в доступе.

Кнопки и панели внутри страниц должны проверять ровно то право, которое требует их API (`PermissionGate`), иначе делегированная роль увидит контрол, который вернёт 403, или наоборот потеряет доступный ей контрол.

Клиентский гейт — это UX. Source of truth остаётся `RequirePermission` на API. При этом гейт не должен открывать страницу, когда права неизвестны: если `/api/me` не загрузился, `ModuleAccessGate` показывает ошибку с повтором, а не контент (`resolveModuleAccessDecision`).

### Общие справочники: любое из прав

Часть чтений нужна нескольким модулям сразу: `GET /marketing/crm-where-options` и `GET /marketing/attribution-options` рисуются в форме лида, в форме сделки и в настройках маркетинга, а PM держит права на сделки без прав на лиды. Для таких эндпоинтов есть `@RequireAnyPermission(...)`: доступ даётся при наличии хотя бы одного права из списка, а `permissionScope` берётся от первого совпавшего, поэтому самый узкий владелец идёт первым. Это инструмент для общих справочников, а не способ расширить основную поверхность модуля — записи и бизнес-чтения остаются на одном `@RequirePermission`.

```text
Permission Role says: can view/edit module/resource family.
Platform Access Foundation says: which project/product/resource this employee can access.
```

Например:

- `credentials.edit` может быть разрешен technical permission role;
- конкретный project credential все равно доступен только если employee проходит Role Access Level / Personal Access Level / ProjectTeamMember / ProductTeamMember / Manual Override policy.

Не добавлять ad hoc credentials-only/project-only scope logic в Settings RBAC; использовать Platform Access Foundation.

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

`CALLS` — platform journal (`/calls`), not a CRM pipeline permission. `CALLS_VIEW` (`OWN` / `DEPARTMENT` / `ALL`) lists calls without requiring `CRM_LEADS` / `CRM_DEALS`. Default: Owner / CEO / Head of Sales `ALL`; Seller `OWN`; Delivery / Marketing / HR none until granted in Settings → Roles. `CALLS_PLAY` — extra capability (module `CALLS`, action `PLAY`). Runtime also accepts legacy `CRM_CALL_RECORDINGS_PLAY`. Default PLAY: Owner / CEO / Seller / Seller Assistant / Head of Sales. Marketing is deny. Playback additionally requires object-level Call access (CALLS and/or CRM predicates) and Drive FileAsset policy for `visibility=RESTRICTED` / `confidentiality=CONFIDENTIAL`. Call **note** mutation uses `CRM_LEADS_EDIT` / `CRM_DEALS_EDIT` (same object-level predicates as Call VIEW, not a separate permission) and is denied for VIEW-only. Note text in Audit Log is readable only through existing `GET /audit` and `GET /audit/user/:userId` with `AUDIT_LOGS.VIEW`.

## System roles

Некоторые роли являются системными:

- нельзя удалить;
- нельзя менять сущность роли (имя / slug / system flag);
- матрицу permissions (VIEW / EDIT / ADD / DELETE + scope) можно менять в Settings → Permissions / RBAC;
- сохранение system-роли — strong confirm (copy / paste имени роли); кастомной роли — simple Yes;
- изменение пишется в audit log.

## Жизненный цикл роли

Назначение роли — основной или дополнительной — создаёт запись `PermissionRoleAssignment`. Эта запись **никогда не удаляется**: при смене роли, offboarding или завершении seat она получает `revokedAt`, чтобы аудит мог ответить, кто какой доступ имел и когда. Поэтому роль, которую хоть раз кому-то назначили, физически удалить нельзя.

Штатный способ вывести роль из обращения — **архивация**:

- `POST /api/roles/:id/archive` (`SETTINGS_RBAC.DELETE`) ставит `Role.archivedAt`;
- `POST /api/roles/:id/restore` (`SETTINGS_RBAC.EDIT`) снимает его обратно;
- архивировать можно только роль, которую **никто не держит**: нет сотрудников с ней как основной, нет активных (не отозванных) grants, нет активных seats с этим mapping. Архивация не отбирает доступ молча;
- архивную роль нельзя назначить ни через один путь — проверка живёт в `canAssignRole`, то есть покрывает смену основной роли, приглашения, приём приглашения и mapping seat;
- архивной роли нельзя менять поля и матрицу permissions; сначала restore;
- системные роли не архивируются.

`GET /api/roles` по умолчанию возвращает только активные роли; `?includeArchived=true` нужен экрану администрирования, чтобы показать архив и дать restore.

`DELETE /api/roles/:id` остаётся только для роли, которую никогда не назначали и которая не привязана ни к одному seat.

## Role editing UX

Экран `Permissions / RBAC`:

- список ролей слева;
- matrix permissions справа;
- фильтр по модулю;
- actions: view/add/edit/delete/approve/export;
- scope selector на каждое право;
- system role badge, archived role badge, archive / restore action;
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

Additive foundation contract, production rollout pending (2026-09-14):

- `PermissionRoleAssignment` — source of truth для дополнительных ролей и provenance; `Employee.role_id` временно сохраняется как primary compatibility role.
- `EmployeeGuard` объединяет permissions всех активных assignments и возвращает compatibility-проекцию scope плюс provenance-aware department grants.
- изменение assignment или permission matrix увеличивает `Employee.access_version`; каждый API instance проверяет revision перед использованием кэша.
- `GET /employees/:id/effective-access` закрыт `SETTINGS_RBAC VIEW` и показывает источники ролей, seats и итоговые permissions.
- `POST /org-seats/:id/access-preview` показывает изменения модульных прав перед назначением/снятием; это предварительный расчёт, а не выдача полномочий. Фактическая запись заново проверяет право назначения. Entity-level policy и персональные overrides остаются отдельным слоем.
- `GET /org-seats/:id/history` показывает последние 100 назначений, включая завершённые.
- создание/изменение seat требует `COMPANY EDIT`; mapping seat → Permission Role дополнительно требует `SETTINGS_RBAC EDIT`; фактическое назначение роли проходит server-side owner/CEO assignment policy.

Для project/product resources effective access должен включать:

- Role Access Levels;
- Personal Access Levels;
- ProjectTeamMember/ProductTeamMember;
- Manual resource overrides.

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
