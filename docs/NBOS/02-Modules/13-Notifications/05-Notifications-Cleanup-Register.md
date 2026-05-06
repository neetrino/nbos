# Notifications Cleanup Register

This file tracks what must be removed, rewritten, or implemented for Notifications to match the new canon.

## A. Accepted canon

- Notifications is a `Notification Engine`, not just a topbar dropdown.
- Event -> Rule -> Job -> Delivery -> Log is the core flow.
- Messenger stores conversation history; Notifications creates system deliveries.
- WhatsApp uses logical `WhatsAppWebAdapter` → **WhatsApp Gateway** → WAHA → QR-connected WhatsApp account.
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

- **Done (2026-04-30):** backend uses Prisma-backed `in_app_notifications` for topbar and Notification Center;
- **Done (2026-04-30):** controller uses `CurrentUser`, not trusted `userId` query;
- **Done (2026-04-30):** `NotificationEvent`, `NotificationRule`, `NotificationJob`, `NotificationDelivery` added for P0 source-of-truth and in-app delivery log;
- **Done (2026-04-30):** idempotency/dedupe keys added for direct in-app delivery;
- **Done (2026-04-30):** Notification Center page supports category filters, mark read and archive;
- no scheduler queue/retry/backoff yet;
- no channel adapters;
- no integration with Messenger outbound copy;
- **Done (2026-05-06):** user preferences by event type/channel (`GET/PATCH /api/notifications/preferences/*`) + Notification Center settings UI; runtime respects disabled event/channel for in-app delivery.
- **Done (2026-05-06):** low-complexity admin rules UI (`Settings -> Module Settings`) with backend `GET/PATCH /api/notifications/admin/rules*` for safe edits (`enabled`, `priority`, `channels`) on non-user rules.
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

- **Done (2026-04-30):** add Prisma models for notification events/rules/jobs/notifications/deliveries;
- **Done (2026-04-30):** use current authenticated user;
- **Done (2026-04-30):** add idempotency/dedupe keys;
- Preferences remain deferred.

### Phase 2 - In-App notifications

- **Done (2026-04-30):** persisted Notification Center;
- **Done (2026-04-30):** topbar unread count from API;
- **Done (2026-04-30):** mark read/archive;
- **Done (2026-04-30):** entity links;
- **Done (2026-04-30):** category filters.

### Phase 3 - Rules and scheduler

- **Done (2026-04-30):** code/config rules for P0 high-value event types: task overdue, finance overdue, mail health/send failure and document access change.
- Scheduler integration, background queue and retry/backoff remain deferred.
- **Done (2026-04-30):** delivery log for `IN_APP` channel.

### Phase 4 - Channel adapters

- Telegram Bot Adapter;
- WhatsAppWebAdapter via Gateway + WAHA;
- Email Adapter;
- channel health alerts.

### Phase 5 - Messenger copy and escalations

- outbound external Messenger copy;
- escalation policies;
- action required flows;
- failed delivery admin tools.

## E. Cross-document cleanup still needed

**Done (2026-04-30):** выровнены `06-Integrations/05-Automation-Scenarios.md` (INV-04 заголовок и сводка; NOT-01 — WhatsApp group + Notification Engine vs Meta Cloud «templates»; явная граница Email канала vs модуль Mail) и `06-Integrations/04-External-Services.md` (секция **Notifications, Mail и внешний WhatsApp**; приоритет MVP для WhatsApp). Архивный `docs/NBOS/archive/00-Technical-Architecture-Brief.md` §7 — строка WhatsApp приведена к WAHA/группам.

Точечный обзор остальных business-logic страниц вне `06-Integrations` — по мере нахождения устаревших формулировок (WhatsApp Business API как основной путь, смешение с Mail inbox).

## F. Mail vs Notifications (documented)

**Done (2026-04-30):** в `01-Notifications-System.md` добавлена секция «Граница с Mail (inbox)»; в `04-Notification-Integrations.md` под `## Email` — подраздел «Mail (NBOS inbox) — не этот канал». Цель: не смешивать transactional Email канала Notification Engine с продуктовым модулем Mail (`17-Mail`).
