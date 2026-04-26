# Support Integrations

> Как Support связан с Messenger, Technical, Tasks, CRM, Finance, Drive и Notifications

## Messenger / External Channels

Messenger - основной канал intake и клиентской коммуникации, но не замена ticket.

### Project WhatsApp Group Flow

```text
Client writes in Project WhatsApp Group
    ->
PM / Support reviews message
    ->
Support Ticket is created or linked
    ->
Ticket owns SLA, category, priority and resolution
    ->
Public update is sent back to external channel
```

Правила:

- внешний чат остаётся каналом общения;
- ticket становится системой учёта кейса;
- важные сообщения должны быть связаны с ticket;
- внутренние обсуждения команды не должны уходить в клиентский чат случайно;
- если клиент пишет повторно по уже открытому кейсу, сообщение связывается с существующим ticket.

## Technical / Infrastructure

Technical / Infrastructure отвечает за technical context.

Support отвечает за client case и SLA.

Если ticket связан с production, deployment, DNS, SSL, hosting, database, monitoring или backup, он должен иметь links:

- Technical Profile;
- Environment;
- Technical Asset;
- Deployment Record;
- Monitoring Check;
- Backup Policy / Restore action, если применимо.

### Technical Incident Flow

```text
Monitoring failed / Client reports issue
    ->
Support Incident created
    ->
Technical context linked
    ->
Tasks / rollback / restore / fix
    ->
Client update
    ->
Resolved / Closed
```

## Tasks / Work Space

Ticket не заменяет Task.

Support создаёт или связывает tasks для выполнения:

- bug fix;
- content update;
- technical investigation;
- deployment rollback;
- DNS/SSL fix;
- evidence collection;
- RCA action.

Ticket закрывается только когда linked execution context имеет понятный результат.

## CRM / Extension Deals

Если ticket является `Change Request` и требует платной доработки:

```text
Support Ticket
    ->
Extension Deal
    ->
CRM pipeline
    ->
Deal Won
    ->
Extension in Projects Hub
    ->
Extension Done
    ->
Support Ticket Closed
```

Support не должен выполнять платные доработки внутри обычной support-очереди.

## Finance / Subscriptions

На triage Support должен проверить coverage:

- есть ли активная Maintenance subscription;
- входит ли кейс в maintenance;
- это goodwill/free work;
- это billable small work;
- нужен Extension Deal.

Если работа billable, Support должен связаться с CRM/Finance flow, а не silently выполнить работу бесплатно.

## Drive

Support evidence хранится через Drive File Assets:

- screenshots;
- logs;
- screen recordings;
- customer proof;
- incident reports;
- RCA documents;
- resolution documents.

Если ticket связан с Product, важные files должны быть видны в Product Library в секции `Support History`.

Temporary screenshots могут попасть в cleanup по Drive rules, но incident/post-mortem материалы хранятся дольше.

## Notifications

Notification Engine отвечает за:

- new ticket;
- ticket assigned;
- client replied;
- SLA warning;
- SLA breach;
- escalation;
- ticket resolved;
- auto-close reminder;
- P1 incident;
- change request waiting in CRM;
- technical monitoring incident.

## My Company / SOP

Support должен использовать SOP:

- Maintenance Triage;
- Incident Response;
- Client Communication;
- Change Request Handling;
- Problem / RCA;
- Escalation.

Если incident повторяется или процесс был неясен, owner должен обновить SOP или создать action task.
