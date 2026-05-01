# Integrations, Security and Audit

> NBOS Settings / Admin - подключение внешних сервисов, системная безопасность и журнал админских действий.

## Integrations

Интеграции должны управляться централизованно, но секреты не должны показываться в Settings открытым текстом.

Примеры интеграций:

- WhatsApp Web adapter / WAHA;
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

- user;
- action;
- entity type;
- entity id;
- old value;
- new value;
- reason;
- ip/device/session, если доступно;
- created at.

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
- failed admin access attempt.

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
