# Settings / Admin Overview

> NBOS Platform - системная админка платформы: настройки, системные списки, технические права, интеграции, безопасность, аудит и feature flags.

## Назначение

`Settings / Admin` - это не место для всех подряд настроек. Это центр системной конфигурации платформы.

Главный принцип:

```text
Settings управляет платформой.
My Company управляет компанией.
Модули управляют своими бизнес-процессами.
```

Поэтому `Settings / Admin` не должен превращаться в свалку бизнес-логики. Если настройка влияет на деньги, сотрудников, KPI, бонусы, сделки, продукты или delivery-процесс, сначала нужно понять: это системная настройка, бизнес-policy или правило конкретного модуля.

## Что входит в Settings / Admin

| Раздел                      | Назначение                                                 |
| --------------------------- | ---------------------------------------------------------- |
| `General Platform Settings` | Общие системные параметры платформы                        |
| `System Lists`              | Справочники и безопасно редактируемые списки               |
| `Permission Roles / RBAC`   | Технические роли доступа и права                           |
| `Module Settings`           | Безопасные параметры модулей                               |
| `Notification Rules`        | Безопасные параметры уведомлений, но не сама бизнес-логика |
| `Integrations`              | Подключения к внешним сервисам                             |
| `Security Defaults`         | Глобальные правила безопасности                            |
| `Audit Log`                 | История важных админских действий                          |
| `Feature Flags`             | Включение/выключение функций по ролям/модулям/окружениям   |

## Что не входит в Settings / Admin

| Не должно жить в Settings  | Где должно жить                    |
| -------------------------- | ---------------------------------- |
| Departments                | `My Company`                       |
| Employees / Team           | `My Company`                       |
| Business seats / positions | `My Company`                       |
| KPI policies               | `My Company`, используется Finance |
| Bonus policies             | `My Company`, используется Finance |
| Compensation profiles      | `My Company`, используется Finance |
| SOP / Process templates    | `My Company`                       |
| My Account                 | Header user menu / личный кабинет  |
| Deal stages and gates      | CRM                                |
| Product lifecycle stages   | Projects Hub / Delivery            |
| Payroll run logic          | Finance                            |
| Invoice payment logic      | Finance                            |
| Credentials secrets        | Credentials Vault                  |

## Main UX concept

`Settings / Admin` должен быть спокойной, строгой админкой, а не операционной доской.

Основная навигация:

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

### General

Минимальные общие параметры платформы:

- company display name для UI;
- default timezone;
- default currency;
- default language;
- system date/time format;
- default file retention policy link;
- support/admin contact.

Важно: юридическая компания, оргструктура, сотрудники и компенсации не должны жить здесь.

### System Lists

Управление справочниками, которые используют разные модули.

Примеры:

- Product Type;
- Product Category;
- Deal Type labels;
- Lead Source labels;
- Channel labels;
- Priority labels;
- Cancellation reasons;
- On Hold reasons.

Системные списки могут быть безопасными и опасными:

- безопасные: label, color, order, active/inactive;
- опасные: code, business meaning, rules binding.

Опасные изменения нельзя делать свободно из UI без отдельной защиты.

### Permissions / RBAC

Технические роли доступа:

- Admin;
- Owner;
- Finance Admin;
- Sales Manager;
- Project Manager;
- Developer;
- Viewer.

Это не то же самое, что business seat.

```text
Seat / Position = кто человек в бизнесе.
Permission Role = что человек может делать в системе.
```

### Module Settings

Безопасные параметры конкретных модулей.

Примеры:

- CRM: default lead owner, default pipeline visibility;
- Finance: default invoice reminder days;
- Notifications: quiet hours;
- Drive: retention policy;
- Credentials: session timeout;
- Messenger: default internal chat tab.

Нельзя превращать `Module Settings` в визуальный редактор бизнес-логики, если эта логика ещё не описана как безопасная policy/template.

### Integrations

Управление внешними подключениями:

- WhatsApp Web adapter / WAHA;
- email provider;
- storage provider;
- notification providers;
- accounting/tax message channel;
- future official APIs.

Секреты интеграций не должны показываться открытым текстом. Доступы хранятся через безопасный слой секретов.

### Security

Глобальные настройки безопасности:

- session lifetime;
- 2FA requirement;
- password policy;
- IP allowlist, если понадобится;
- vault access defaults;
- admin action confirmation rules.

### Feature Flags

Feature flags нужны, чтобы безопасно включать функции:

- только для owner/admin;
- только для конкретного модуля;
- только для тестового окружения;
- только для выбранной группы сотрудников.

Feature flag не заменяет permissions. Flag отвечает за доступность функции, RBAC - за право действия.

### Audit Log

Любое важное изменение в Settings должно оставлять след:

- кто изменил;
- что изменил;
- старое значение;
- новое значение;
- причина, если действие рискованное;
- дата/время;
- источник действия.

## Boundary with My Company

`My Company` описывает бизнес-структуру:

```text
Department -> Seat -> Seat Assignment -> Employee
```

`Settings / Admin` описывает техническую конфигурацию:

```text
Permission Role -> Permission -> Scope
System List -> Option
Integration -> Adapter -> Status
Feature Flag -> Target
Audit Event
```

Если настройка нужна CEO/HR/Finance для управления людьми, зарплатой, KPI или бонусами - это почти всегда `My Company`, не `Settings`.

Если настройка нужна администратору платформы, чтобы управлять доступом, списками, интеграциями и безопасностью - это `Settings`.

## Canonical rule

```text
Settings can configure labels and safe parameters.
Business-critical logic is code/config controlled until it is explicitly designed as a safe admin policy UI.
```

Это защищает NBOS от ситуации, когда случайное изменение в админке ломает CRM, Finance, Payroll, Subscription или Delivery.

## Связи с другими модулями

```text
Settings -> My Company
  Permission roles may be assigned through employee/seat profile, but business structure lives in My Company.

Settings -> CRM
  System lists, permissions, module settings.

Settings -> Finance
  Safe module settings and notification parameters only.
  KPI/Bonus/Compensation policies live in My Company.

Settings -> Notifications
  Provider settings, quiet hours, default templates, safe rule parameters.

Settings -> Messenger
  Integration adapters and provider status.

Settings -> Drive
  Storage provider, retention defaults, audit.

Settings -> Credentials
  Vault security defaults and access policies, not secret values.

Settings -> Technical Infrastructure
  Environment-level flags, integrations, audit, release safety.
```
