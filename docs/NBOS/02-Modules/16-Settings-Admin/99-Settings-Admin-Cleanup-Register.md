# Settings / Admin Cleanup Register

> NBOS Settings / Admin - что нужно привести к новому канону после отделения системной админки от My Company и модульной бизнес-логики.

## Назначение

Этот файл фиксирует расхождения между текущей реализацией / старыми документами и новым каноном `Settings / Admin`.

Новый канон:

- `Settings / Admin` является системной админкой платформы;
- `My Company` хранит departments, employees, seats, compensation, KPI, bonus policies и SOP;
- `My Account` открывается из header user menu, а не из Settings;
- system lists должны иметь protection level и audit;
- permission roles должны быть отделены от business seats;
- module settings должны менять только безопасные параметры;
- feature flags должны быть отдельным управляемым слоем;
- integrations должны иметь health/status/audit и не хранить секреты открытым текстом;
- security defaults должны быть централизованы;
- все критичные изменения должны попадать в audit log.

---

## A. Already aligned / Уже совпадает с каноном

### A1. My Company docs already separate Settings boundary

Статус: `OK DOCS`

[My Company Overview](../07-My-Company/00-My-Company-Overview.md) уже фиксирует:

- `My Company` = бизнес-структура;
- `Settings` = system lists, technical permission roles, integrations, platform settings, audit log, API/webhooks, security defaults;
- `My Account` не находится в Settings.

### A2. My Account page exists separately

Статус: `PARTIAL UI`

В runtime уже есть отдельная страница `My Account`. Это правильно по канону.

Остаток: убрать ссылку/раздел `My Account` из Settings navigation.

### A3. Basic RBAC UI exists

Статус: `PARTIAL UI / PARTIAL CODE`

В runtime уже есть админский экран roles/permissions и scope values:

- `NONE`;
- `OWN`;
- `DEPARTMENT`;
- `ALL`.

Остаток: усилить entity-level enforcement, audit и separation от business seats.

### A4. Basic System Lists UI exists

Статус: `PARTIAL UI / PARTIAL CODE`

В runtime уже есть UI для system lists и пример `PRODUCT_TYPE`.

Остаток: добавить protection model, owner module, audit и запрет опасных операций.

---

## B. Runtime / UI stale

### B1. Settings page contains company/business settings

Статус: `DONE IN UI SHELL SLICE`

Текущий Settings page содержит company form / company settings. По новому канону это нужно разделить:

- platform display/general technical settings могут остаться в Settings;
- business company structure, departments, employees, compensation и policies должны жить в `My Company`;
- юридические/организационные данные компании не должны смешиваться с системной админкой.

Runtime Settings landing no longer shows hardcoded company/legal fields and now presents system admin sections.

### B2. My Account appears inside Settings

Статус: `DONE IN UI SHELL SLICE`

`My Account` должен открываться из header user menu.

Future implementation:

- убрать `My Account` из Settings sidebar/subnavigation;
- оставить профиль, security и personal notifications в личном кабинете;
- не смешивать личный аккаунт с системной админкой.

### B3. Departments currently live under Settings

Статус: `DONE IN SIDEBAR / STALE ROUTE KEPT FOR COMPATIBILITY`

`Departments` должны переехать в:

```text
My Company -> Departments
```

Settings не должен быть местом для оргструктуры.
Sidebar now routes Departments through `My Company -> Departments`. The old `/settings/departments` route still exists as a compatibility route until a dedicated My Company implementation can own the page component directly.

### B4. Settings navigation lacks complete admin structure

Статус: `SHELL DONE / WORKFLOWS PENDING`

Нужно привести навигацию к канону:

```text
Settings / Admin
  General
  System Lists
  Permissions / RBAC
  Module Settings
  Integrations
  Security
  Feature Flags
  Audit Log
```

Runtime navigation and placeholder routes now expose this structure. Data models, API enforcement and audit remain later Settings/Admin slices.

---

## C. Runtime missing / Needs implementation

### C1. System Lists protection model is missing

Статус: `PHASE 1 FOUNDATION DONE / FULL MODEL PENDING`

Нужно добавить:

- `SystemList`;
- `owner_module`;
- `protection_level`;
- `is_protected`;
- запрет изменения `code` для protected options;
- запрет удаления используемых options;
- deactivate вместо delete;
- audit изменений.

Phase 1 runtime now protects current managed lists at the API/UI level: protected option codes cannot be changed, delete deactivates options, admin mutations require permissions, and changes are written to audit logs. A dedicated `SystemList` metadata table with owner module/protection level remains a later deep Settings/Admin slice.

### C2. System Lists API allows risky operations

Статус: `PHASE 1 HARDENED`

Если API позволяет свободно create/delete/update options, это риск.

Нужно:

- ограничить операции по protection level;
- проверять зависимости перед delete/deactivate;
- писать audit;
- запретить изменение code для business-bound values;
- показывать warning в UI.

Runtime now removes public write access, uses `COMPANY.EDIT` for mutations, blocks protected code edits, deactivates instead of deleting, and shows protected-list warnings in UI.

### C3. RBAC scope enforcement is incomplete

Статус: `FOUNDATION HARDENED / ENTITY SCOPE PENDING`

Если guard только определяет `permissionScope`, но не проверяет конкретную запись, это недостаточно.

Нужно:

```text
Permission exists -> Scope resolved -> Entity access checked
```

Пример:

- Seller видит свои deals;
- Head of Sales видит deals отдела;
- Owner видит все deals.

Phase 1 adds stronger admin mutation permissions and audit logging for roles. Entity-level enforcement for business records remains module-specific work in later phases.

### C4. Business role and permission role may be mixed

Статус: `BOUNDARY VISIBLE / DATA MODEL PENDING`

Нужно разделить:

- `Seat / Position` в My Company;
- `Permission Role` в Settings.

Employee может иметь несколько seats и несколько permission roles. Итоговый доступ должен быть виден как effective access.

Phase 1 keeps technical permission roles in Settings/RBAC and exposes business-seat gaps in My Company. Multiple seats / effective access visualization remain later My Company + Settings slices.

### C5. Feature Flags are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить feature flag layer:

- key;
- module;
- enabled/disabled;
- target role/user/environment;
- rollout percent later;
- audit;
- emergency disable.

### C6. Module Settings are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить безопасные module settings:

- CRM defaults;
- Finance safe reminder settings;
- Notifications quiet hours;
- Messenger default tabs;
- Drive retention;
- Credentials session timeout.

Нельзя добавлять сюда произвольный редактор payroll/bonus/subscription logic.

### C7. Integrations admin is missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить:

- integration registry;
- provider;
- status;
- health check;
- last sync;
- last error;
- reconnect/disable actions;
- secret reference;
- audit.

### C8. Security defaults are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить:

- session lifetime;
- 2FA requirement;
- password policy;
- vault reveal reason default;
- inactive user lock;
- offboarding revoke policy.

### C9. Audit Log is missing or incomplete

Статус: `MISSING CODE / MISSING UI`

Нужно добавить единый audit log для:

- Settings changes;
- RBAC changes;
- System Lists changes;
- Integration changes;
- Security changes;
- Feature Flags changes;
- risky admin actions.

---

## D. Implementation order

Рекомендуемый порядок:

1. Очистить навигацию: убрать My Account и Departments из Settings.
2. Добавить `My Company` routes для Departments/Team/Org Structure, если ещё не сделано.
3. Усилить System Lists protection model.
4. Усилить RBAC entity-level scope enforcement.
5. Добавить Audit service для Settings actions.
6. Добавить Integrations admin skeleton.
7. Добавить Module Settings skeleton.
8. Добавить Feature Flags.
9. Добавить Security Defaults.

## E. Non-goals for MVP

В MVP не нужно:

- visual business-rule builder;
- произвольный formula builder для payroll/bonus;
- удаление audit events;
- свободное удаление system list values;
- хранение integration secrets plain text;
- смешивание Settings с My Company.
