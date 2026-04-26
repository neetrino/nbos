# Monitoring, Backups And Incidents

> Operational health продукта после запуска

## Monitoring

Monitoring показывает, жив ли production и есть ли технические проблемы.

MVP может начинаться с ручного статуса и простых external checks, но модель должна позволять дальнейшую автоматизацию.

### Monitoring Check

Типы checks:

- uptime check;
- SSL expiration check;
- domain/DNS check;
- API health check;
- error rate check;
- database health check;
- queue/worker check;
- cron/scheduler check;
- storage check.

### Поля Monitoring Check

| Поле              | Описание                               |
| ----------------- | -------------------------------------- |
| `product`         | Product                                |
| `environment`     | Production / Staging / Development     |
| `check_type`      | Uptime / SSL / DNS / API / Error / DB  |
| `target`          | URL, endpoint, domain или asset        |
| `status`          | Healthy / Warning / Critical / Unknown |
| `last_checked_at` | последняя проверка                     |
| `last_success_at` | последний успешный check               |
| `owner`           | кто отвечает                           |
| `linked_incident` | incident, если check failed            |

## Backup Policy

Backup Policy описывает, что бэкапится и как восстановить.

### Поля Backup Policy

| Поле                   | Описание                                               |
| ---------------------- | ------------------------------------------------------ |
| `product`              | Product                                                |
| `environment`          | Production / Staging / Development                     |
| `asset`                | database/storage/server, если policy привязана к asset |
| `backup_type`          | Database / Files / Full / Provider Snapshot / Manual   |
| `frequency`            | Daily / Weekly / Monthly / Manual / Not Required       |
| `retention`            | сколько хранить                                        |
| `storage_location`     | где хранится backup metadata без secret                |
| `credential`           | ссылка на Credentials, если нужен доступ               |
| `last_backup_at`       | последний backup                                       |
| `last_restore_test_at` | последний test restore                                 |
| `status`               | Healthy / Warning / Missing / Not Required             |
| `owner`                | ответственный                                          |

Backup credentials, access keys и storage secrets хранятся только в Credentials.

## Restore Test

Backup без проверки восстановления - слабая гарантия.

Для critical products нужно фиксировать:

- когда последний раз тестировали restore;
- кто тестировал;
- результат;
- какие проблемы нашли;
- какие tasks созданы.

## Technical Incident

Technical Incident - это проблема с technical health продукта.

Примеры:

- production down;
- deployment failed;
- SSL expired;
- DNS broken;
- database unavailable;
- API integration broken;
- storage issue;
- high error rate;
- lost credentials;
- backup failed.

Technical Incident должен быть связан с Support Ticket category `Incident`.

Technical module показывает technical context, а Support управляет workflow обращения, SLA, communication и RCA.

## Incident Flow

```text
Monitoring failed / employee reports issue
    ->
Support Incident created
    ->
Technical asset / environment linked
    ->
Responsible owner assigned
    ->
Fix / rollback / restore
    ->
Post-incident notes
    ->
Problem/RCA if recurring or critical
```

## Operational Health

Product Technical Profile должен показывать health summary:

- production status;
- monitoring status;
- backup status;
- deployment status;
- open incidents;
- overdue checks;
- missing owner;
- missing credentials;
- missing domain/service links.

Статусы:

- `Healthy`;
- `Warning`;
- `Critical`;
- `Unknown`;
- `Not Configured`;
- `Not Required`.

## Notifications

Notification Engine должен отправлять уведомления по событиям:

- monitoring check failed;
- SSL expires soon;
- domain/DNS issue;
- backup failed;
- restore test overdue;
- deployment failed;
- production incident opened;
- critical technical asset has no owner;
- required credentials missing.
