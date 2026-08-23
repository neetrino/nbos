# Integrations, Security and Audit

> NBOS Settings / Admin - подключение внешних сервисов, системная безопасность и журнал админских действий.

## Integrations

Интеграции должны управляться централизованно, но секреты не должны показываться в Settings открытым текстом.

Примеры интеграций:

- WhatsApp Web adapter / WAHA;
- ATS.am telephony (configured / not; never show `ATS_API_KEY`);
- email provider;
- file storage provider;
- notification provider;
- accounting WhatsApp group channel;
- future tax/accounting API;
- Git/repository provider, если понадобится;
- AI provider, если будет использоваться.

## Integration model

```text
Integration
  key
  provider
  status
  owner_module
  environment
  health_status
  last_sync_at
  config_metadata
  secret_reference
```

Секреты хранятся не в plain settings, а через безопасный secret layer / vault reference.

## Integration UX

Экран `Integrations`:

- provider cards;
- status: connected / disconnected / degraded / error;
- owner module;
- health check;
- last successful sync;
- last error;
- reconnect action;
- disable action;
- audit tab;
- link to related logs.

## WhatsApp example

Для ближайшей логики NBOS основной путь:

```text
WAHA / WhatsApp Web Adapter через QR
```

Он покрывает:

- project WhatsApp groups;
- invoice reminders в группы;
- maintenance/support уведомления в группы;
- бухгалтерскую WhatsApp-группу;
- редкие 1:1 чаты;
- чтение/отправку сообщений через QR-connected WhatsApp.

Official WhatsApp API пока не является обязательным направлением, потому что основной бизнес-процесс идёт через группы и ответы в существующих чатах.

## Security Defaults

Security в Settings задаёт глобальные правила:

- session lifetime;
- 2FA requirement;
- password policy;
- IP allowlist, если понадобится;
- vault reveal reason requirement;
- admin action confirmation;
- inactive user lock;
- offboarding access revoke policy.

## Credentials boundary

`Settings / Admin` может управлять политиками безопасности vault:

- session timeout;
- reveal reason required;
- emergency access enabled/disabled;
- access review interval.

Но сами секреты, пароли, доступы и reveal flow живут в `Credentials`.

## Audit Log

Audit log - обязательный слой для всех критичных действий.

Пишем:

- actor type + actor id (Employee / External Agent / Internal AI / System / Automation);
- optional legacy `userId` for human rows;
- optional `onBehalfOf` when a human started an AI action;
- channel / protocol / correlation id when present;
- action;
- entity type;
- entity id;
- old value;
- new value;
- reason;
- ip/device/session, если доступно (без raw tokens);
- created at.

Existing historical rows stay readable. Machine actors must not be written as fake Employees. Secrets, bearer tokens and full prompts are not stored in `changes`. Canon: `02-Modules/21-AI-Platform/05-AI-Data-Security-and-Audit.md`.

## Что обязательно аудировать

- изменение permission role;
- назначение/снятие permission role;
- изменение system list;
- изменение feature flag;
- изменение integration config;
- отключение integration;
- изменение security defaults;
- reveal secret в Credentials;
- payroll policy changes;
- finance approval settings;
- export sensitive data;
- failed admin access attempt;
- AI provider key preflight validation, including failed attempts, before rotation replaces a stored key;
- External Agent token issue/rotate/revoke, capability grant/revoke and scope grant/revoke;
- External Agent policy denials.

## Audit UX

Экран `Audit Log`:

- timeline;
- filters by user/module/action/entity/date;
- before/after view;
- risk badge;
- export для owner/admin;
- link to affected entity.

## Retention

Audit events нельзя удалять обычным UI.

Для MVP:

- хранить audit постоянно;
- архивировать только по системной retention policy;
- запрещать ручное удаление.

## Cleanup hints

Если сейчас нет полного audit layer, нужно добавить:

- единый audit service;
- audit events для Settings;
- audit events для RBAC;
- audit events для system lists;
- integration health status;
- secret references вместо plain secret values.
