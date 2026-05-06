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
- ~~mock data only~~ **Done (2026-04-30):** UI uses `GET /api/calendar/events`;
- ~~event types include `meeting/deadline/billing/personal`~~ **Done (2026-04-30):** UI exposes only All / Meetings / Delivery Deadlines / Personal;
- ~~no API integration~~ **Done (2026-04-30):** `CalendarModule` + projection API;
- ~~no source/projection model~~ **Partial (2026-04-30):** Meeting + Personal models; Product/Extension deadline projections;
- ~~no layer visibility rules~~ **Partial (2026-04-30):** CALENDAR RBAC scope gates list; personal events are owner-only; delivery projections use owner/PM assignment for non-wide scopes.

Current Scheduler:

- `apps/api/src/modules/scheduler/scheduler.service.ts`;
- narrow Finance-oriented manual endpoints;
- no job model;
- no retry/idempotency/audit;
- invoice overdue / card reminders опираются на **Finance Invoice Card / money layer** (legacy invoice pipeline enum снят — см. Finance cleanup register); глубина job-model/retry — backlog.

## D. Implementation backlog

### Phase 1 - Calendar data model

- ~~add Meeting entity~~ done (`CalendarMeeting`);
- ~~add Personal Calendar Event entity~~ done (`PersonalCalendarEvent`);
- ~~define Calendar Event Projection API~~ done (`GET /api/calendar/events`);
- implement visibility by source entity access — partial: RBAC scope + PM/assignee/participant rules; deeper per-source access resolver can be added later.

### Phase 2 - Calendar UI

- ~~replace mock events with API data~~ done;
- ~~tabs/filters: All, Meetings, Delivery Deadlines, Personal~~ done;
- ~~source badges~~ done;
- ~~click-through to source entity~~ partial: deadline projections include source links; meeting/personal detail pages are not part of P0.
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

## E. Cross-module documentation

| Topic                  | Status | Notes                                                                                                                                        |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Mail vs Calendar inbox | `OK`   | **2026-04-30:** `05-Calendar-Integrations.md` (**Mail**) links to `17-Mail`; main Calendar stays time-focused, not email threads or mailbox. |
