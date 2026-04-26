# Calendar Cleanup Register

This file records what must change so Calendar/Scheduler match the new canon.

## A. Accepted canon

- Main Calendar has only three layers: `Meetings`, `Delivery Deadlines`, `Personal`.
- `All` is a combined view, not a business layer.
- Meetings are client-facing only in MVP.
- Delivery Deadlines show only Product and Extension deadlines.
- Personal is minimal.
- Finance/Tasks/Support/Team dates do not belong in main Calendar.
- Calendar shows projections, not duplicate source-of-truth records.
- Scheduler is backend/system layer, not a Calendar tab.
- Notifications sends reminders/escalations.

## B. Current doc cleanup

Old Calendar doc described:

- internal meetings;
- task due dates;
- sprint end dates;
- team schedule/vacations;
- billing calendar;
- finance dates;
- broad "all company dates" scope.

This is too noisy for the main left-menu Calendar and has been replaced with focused scope.

## C. Runtime gaps

Current UI:

- `apps/web/src/app/(app)/calendar/page.tsx`;
- mock data only;
- event types include `meeting/deadline/billing/personal`;
- no API integration;
- no source/projection model;
- no layer visibility rules.

Current Scheduler:

- `apps/api/src/modules/scheduler/scheduler.service.ts`;
- narrow Finance-oriented manual endpoints;
- no job model;
- no retry/idempotency/audit;
- old invoice overdue status logic.

## D. Implementation backlog

### Phase 1 - Calendar data model

- add Meeting entity;
- add Personal Calendar Event entity;
- define Calendar Event Projection API;
- implement visibility by source entity access.

### Phase 2 - Calendar UI

- replace mock events with API data;
- tabs/filters: All, Meetings, Delivery Deadlines, Personal;
- source badges;
- click-through to source entity;
- user default layer.

### Phase 3 - Scheduler boundary

- create Scheduler Job model;
- add idempotency;
- add job audit;
- route reminders to Notifications;
- stop treating Scheduler as direct message/status owner.

### Phase 4 - Cross-module cleanup

- remove Finance/Billing from main Calendar docs/UI;
- keep Finance calendar/grid inside Finance;
- keep Task deadlines inside Tasks;
- keep Support SLA views inside Support;
- review Platform/UI docs for old broad Calendar descriptions.
