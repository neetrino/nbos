# Notifications Cleanup Register

This file tracks what must be removed, rewritten, or implemented for Notifications to match the new canon.

## A. Accepted canon

- Notifications is a `Notification Engine`, not just a topbar dropdown.
- Event -> Rule -> Job -> Delivery -> Log is the core flow.
- Messenger stores conversation history; Notifications creates system deliveries.
- WhatsApp uses `WhatsAppWebAdapter -> WAHA -> QR-connected WhatsApp account`.
- WhatsApp messages mainly go to groups, not 1:1 contacts.
- `WhatsAppOfficialAdapter / Meta Cloud API` is not MVP and not planned for the next years.
- External notification delivery must create Messenger outbound copy.
- Work that needs tracking should become Task/action, not just notification.
- Rules are code/config first in MVP, not a fully open admin UI.

## B. Runtime gaps

Current code:

- `apps/api/src/modules/notifications/notification.service.ts`
- `apps/api/src/modules/notifications/notification.controller.ts`
- `apps/web/src/components/layout/NotificationDropdown.tsx`
- `apps/web/src/components/account/MyAccountTabs.tsx`
- `packages/database/prisma/schema.prisma`

Problems:

- backend uses in-memory `Map`;
- no Prisma notification tables;
- controller accepts `userId` query instead of current authenticated user;
- no Notification Event/Rule/Job/Delivery model;
- no queue/retry/delivery log;
- no channel adapters;
- no integration with Messenger outbound copy;
- no user preferences beyond mock UI;
- topbar dropdown uses static mock notifications;
- no websocket/live unread count.

## C. Stale documentation removed

Old Notifications doc contained:

- WhatsApp Business API as primary path;
- pre-approved templates as canonical;
- old Deal wording `New / Extension / Upsell`;
- client WhatsApp as mostly 1:1 contact message;
- notification logic tied too much to old invoice stages.

New docs replace this with:

- `01-Notifications-System.md`;
- `02-Notification-Engine-Architecture.md`;
- `03-Notification-Rules-and-Escalations.md`;
- `04-Notification-Integrations.md`;
- `05-Notifications-Cleanup-Register.md`.

## D. Implementation backlog

### Phase 1 - Data foundation

- add Prisma models for notification events/rules/jobs/notifications/deliveries/preferences;
- remove in-memory store;
- use current authenticated user;
- add idempotency/dedupe keys.

### Phase 2 - In-App notifications

- persisted Notification Center;
- topbar unread count from API;
- mark read/archive;
- entity links;
- category filters.

### Phase 3 - Rules and scheduler

- code/config rules;
- scheduler integration;
- queue jobs;
- retry/backoff;
- delivery log.

### Phase 4 - Channel adapters

- Telegram Bot Adapter;
- WhatsAppWebAdapter via WAHA;
- Email Adapter;
- channel health alerts.

### Phase 5 - Messenger copy and escalations

- outbound external Messenger copy;
- escalation policies;
- action required flows;
- failed delivery admin tools.

## E. Cross-document cleanup still needed

After this pass, review and align:

- `06-Integrations/05-Automation-Scenarios.md`;
- `06-Integrations/04-External-Services.md`;
- old business logic pages that still say "WhatsApp client template" instead of WhatsApp group message through Notification Engine.
