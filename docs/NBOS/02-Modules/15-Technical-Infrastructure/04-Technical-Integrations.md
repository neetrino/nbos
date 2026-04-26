# Technical Infrastructure Integrations

> Связи Technical / Infrastructure с остальными модулями NBOS

## Project Hub

Product page должен иметь технический блок или вкладку:

- Technical Profile;
- Environments;
- Technical Assets;
- Deployment Records;
- Monitoring;
- Backups;
- Linked Incidents.

Delivery Board использует Technical readiness как stage gate перед `Transfer`.

## Finance / Client Services

Finance хранит финансовую сторону domain/hosting/service.

Technical хранит техническую зависимость.

Правильная связь:

```text
Technical Asset
    ->
Client Service Record
    ->
Invoice / Expense / Renewal Task
```

Пример:

- domain `marco.am` в Finance имеет renewal date, cost, client charge;
- тот же domain в Technical является production dependency с DNS/SSL status.

## Credentials

Technical не хранит secrets.

Все sensitive данные идут ссылкой в Credentials:

- `.env`;
- hosting panel login;
- database connection string;
- API key;
- SSH/private key;
- deploy token;
- backup storage access.

Если secret найден в technical notes, это security incident.

## Support

Technical incidents должны быть linked с Support Ticket.

Support отвечает за:

- SLA;
- communication;
- status workflow;
- RCA/problem;
- client-facing history.

Technical отвечает за:

- affected asset;
- affected environment;
- deploy/rollback context;
- monitoring/backups context;
- operational health.

## Tasks / Work Space

Technical module может создавать или связывать tasks:

- setup production environment;
- configure DNS;
- configure SSL;
- save `.env` in Credentials;
- connect monitoring;
- configure backup;
- run restore test;
- investigate incident;
- update deployment runbook.

## Drive

Drive хранит non-secret technical documents:

- architecture notes;
- deployment guides без secrets;
- provider invoices;
- incident reports;
- screenshots без passwords/tokens;
- exported reports.

Secrets в Drive запрещены.

## Notifications

Notification Engine отправляет:

- deployment failed;
- monitoring failed;
- SSL/domain warning;
- backup failed;
- restore test overdue;
- incident opened/resolved;
- technical readiness missing before Transfer.

## My Company / SOP

Technical processes должны иметь SOP/runbooks:

- Deployment checklist;
- Rollback runbook;
- Incident response;
- Domain/DNS setup;
- Backup/restore test;
- Production handover.

SOP Document объясняет процесс человеку, а Technical module показывает, применён ли процесс к конкретному Product.

## Calendar / Scheduler

Main Calendar не должен засоряться technical events.

Technical dates живут внутри Technical module и Notifications:

- SSL expiration;
- backup test due;
- domain technical check;
- monitoring maintenance window.

Если событие критично для owner/CEO, Notification Engine может создать notification/task.
