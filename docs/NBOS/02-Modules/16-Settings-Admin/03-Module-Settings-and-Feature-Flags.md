# Module Settings and Feature Flags

> NBOS Settings / Admin - безопасные настройки модулей и управление включением функций.

## Назначение

`Module Settings` и `Feature Flags` нужны, чтобы управлять поведением платформы без изменения кода там, где это безопасно.

Но они не должны превращаться в визуальный редактор всей бизнес-логики.

Главное правило:

```text
UI может менять безопасные параметры.
Сложная бизнес-логика живёт в code-defined policy templates.
```

## Module Settings

Настройки модуля - это параметры, которые понятны, ограничены и безопасны.

Примеры:

### CRM

- default lead owner;
- default pipeline;
- default lost reasons;
- required marketing fields toggle;
- default offer attachment requirement.

### Finance

- default invoice reminder days;
- default payment grace period;
- default expense approval threshold;
- default payroll close day.

Важно: KPI, Bonus Policy и Compensation не живут здесь. Они живут в `My Company`.

### Notifications

- default quiet hours;
- default reminder intervals;
- fallback channel;
- escalation delay presets.

### Messenger

- default internal messenger tab by role;
- external adapter provider;
- allowed attachment size;
- chat retention policy link.

### Drive

- default library retention;
- archive threshold;
- max upload size;
- allowed file types.

### Credentials

- vault session timeout;
- reveal reason required;
- emergency access disabled/enabled;
- default access review interval.

## Safe vs unsafe settings

### Safe setting

Можно менять из UI:

- label;
- number of days;
- default assignee;
- color;
- notification interval;
- feature visibility.

### Unsafe setting

Нельзя менять свободно:

- deal won blocking logic;
- payroll calculation formula;
- partner payout formula;
- bonus release formula;
- subscription billing engine;
- credential encryption behavior;
- task close condition engine.

Для unsafe settings нужен отдельный policy/template approach.

## Feature Flags

Feature flag включает или выключает функцию.

Примеры:

- enable new Finance views;
- enable Work Space Scrum mode;
- enable WhatsApp Web adapter;
- enable Credentials emergency access;
- enable new Calendar layer;
- enable experimental dashboard.

## Feature flag model

```text
FeatureFlag
  key
  name
  description
  status
  target_type
  target_id
  environment
  rollout_percent
  created_by
  audit
```

### Target type

| Target        | Значение                     |
| ------------- | ---------------------------- |
| `GLOBAL`      | Для всех                     |
| `MODULE`      | Для конкретного модуля       |
| `ROLE`        | Для permission role          |
| `EMPLOYEE`    | Для конкретного пользователя |
| `ENVIRONMENT` | Для dev/staging/production   |

## Feature flags vs permissions

Feature flag не заменяет permissions.

```text
Feature Flag = функция существует и включена.
Permission = пользователь имеет право ей пользоваться.
```

Пример:

```text
Flag: finance.new_payroll_ui = enabled
Permission: finance.payroll.edit = required
```

## UX

Экран `Feature Flags`:

- grouped by module;
- status: enabled/disabled/partial;
- target visibility;
- environment badge;
- rollout percent;
- owner;
- last changed;
- audit;
- emergency disable button.

## Change safety

Для production feature flags нужны:

- change reason;
- affected users preview;
- rollback plan для risky flags;
- audit event.

## Cleanup hints

Если сейчас feature flags отсутствуют, MVP можно начать с простого:

- `key`;
- `enabled`;
- `module`;
- `description`;
- `target_role`;
- audit.

Потом расширить до environment/rollout/employee targeting.
