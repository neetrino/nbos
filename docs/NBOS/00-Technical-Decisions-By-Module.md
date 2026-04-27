# NBOS Technical Decisions By Module

> Mandatory technical decision index for implementing NBOS modules.

## Purpose

This document consolidates module-level architecture decisions that must not be missed during implementation.

Use it before building or changing any module together with:

1. `docs/NBOS/00-Implementation-Roadmap.md`
2. The module canon in `docs/NBOS/02-Modules/*`
3. The related cleanup register

`docs/TECH_CARD.md` defines the platform stack. This file defines how modules must use that stack.

## Global Technical Rules

These rules apply to all modules unless a module-specific decision explicitly says otherwise.

| Area                 | Decision                                                                                                          | Reason                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Realtime             | Use Socket.io through NestJS Gateway. Do not use raw WebSocket directly.                                          | Rooms, reconnects, auth handshake and Redis adapter support matter more than low-level control. |
| Source of truth      | PostgreSQL DB is the source of truth. Realtime only delivers events.                                              | Prevents lost or inconsistent messages, statuses, notifications and money states.               |
| API                  | Use REST + OpenAPI for commands, reads and history.                                                               | Keeps web, future mobile and integrations on stable contracts.                                  |
| Async work           | Use BullMQ for external, long-running, scheduled or retryable work.                                               | HTTP requests must not block on WhatsApp, email, billing, SLA, exports or webhook retries.      |
| Internal events      | Use synchronous domain events only for local in-process reactions; use queues when retry/idempotency is required. | Keeps module boundaries clear without losing reliability for critical flows.                    |
| Files                | Drive owns files; modules link `FileAsset` records.                                                               | Prevents each module from inventing its own storage model.                                      |
| Audit                | Use one Audit Log for sensitive and business-critical actions.                                                    | Finance, credentials, permissions, payments and external sends require traceability.            |
| Missing dependencies | Missing linked modules, data or integrations must not crash the current module.                                   | NBOS is built module by module and must degrade gracefully.                                     |
| Fake data            | Never fake financial, payment, payroll, credential, audit or report data.                                         | Missing data must be visible, not hidden behind misleading values.                              |

## Module Decisions

### Auth, RBAC And Audit

| Area  | Decision                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------ |
| Auth  | NextAuth session on web plus backend JWT for API calls.                                          |
| RBAC  | Enforce module, project and record-level access in NestJS guards/services.                       |
| Audit | Log permission changes, credential reveals, finance/payment actions, exports and external sends. |
| MVP   | Invite-only access, role-based navigation, backend enforcement and audit foundation.             |
| Later | 2FA hardening, impersonation only if explicitly approved and audited.                            |

### CRM And Marketing

| Area          | Decision                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Stage gates   | Enforce Lead/Deal gates in backend services, not only in UI.                                                   |
| Attribution   | Marketing attribution is manual in MVP.                                                                        |
| Finance link  | Marketing spend may link to Finance Expense, but attribution must still work when the finance link is missing. |
| External APIs | Meta/Google Ads APIs are not MVP.                                                                              |
| Reports       | Do not calculate CPL/ROI when spend is missing; show missing data.                                             |

### Finance And Partners

| Area             | Decision                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Money model      | Use operational finance journal and idempotent events, not simple mutable status updates.      |
| Payments         | Use payment links with IDBank/ARCA and Idram; verify signed webhooks.                          |
| Idempotency      | Every external payment event must be idempotent.                                               |
| FX               | Store rate context on the operation date; do not silently recalculate historical money states. |
| Bank integration | MVP is manual reconciliation; bank automation stays pluggable for later.                       |
| Partners         | Partner payouts depend on Finance rules and must not bypass journal/idempotency logic.         |

### Projects Hub, Tasks And Support

| Area            | Decision                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Delivery source | Product and Extension lifecycle are the delivery source of truth.                                      |
| Gates           | Lifecycle gates live in backend services.                                                              |
| Realtime        | Use Socket.io only for live updates such as status/comment/task changes.                               |
| SLA             | Use scheduler/BullMQ for SLA timers and reminders.                                                     |
| Support links   | Support may link to tasks or extension requests, but must not break when those modules are incomplete. |

### Drive

| Area      | Decision                                                                   |
| --------- | -------------------------------------------------------------------------- |
| Storage   | Use Cloudflare R2 as the object store.                                     |
| Ownership | Drive owns file metadata and storage references.                           |
| Linking   | Modules link Drive file assets instead of storing independent file models. |
| Exports   | Reports, snapshots and large exports write files through Drive.            |
| Truth     | Bucket paths are not business truth; DB metadata and links are.            |

### Credentials

| Area       | Decision                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Encryption | Use AES-256-GCM field-level encryption for secret fields.                                                            |
| List APIs  | Never return decrypted secrets in list APIs.                                                                         |
| Reveal     | Reveal/copy/export must use explicit endpoints and audit every access.                                               |
| Step-up    | Require step-up authentication for high-risk reveal/export flows; MVP may start with password re-auth, then add 2FA. |
| Boundaries | Secrets must not be stored in Messenger, Drive comments, task comments or plain text logs.                           |

### Messenger

| Area            | Decision                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| Architecture    | Use adapter architecture for external channels.                                              |
| Source of truth | Message history lives in PostgreSQL.                                                         |
| API split       | REST handles history, commands and search; Socket.io handles live events.                    |
| WhatsApp MVP    | Use WAHA through a WhatsApp Web adapter.                                                     |
| Sending         | External sends go through BullMQ, not directly from HTTP requests.                           |
| Attachments     | Attachments are Drive file assets.                                                           |
| Search          | Use PostgreSQL search for MVP; consider Meilisearch only after volume or UX proves the need. |

### Mail

| Area                | Decision                                                                              |
| ------------------- | ------------------------------------------------------------------------------------- |
| Architecture        | Use provider adapters for Gmail OAuth and IMAP/SMTP.                                  |
| Sync/send           | Mail sync, send, attachments and retries go through BullMQ.                           |
| Transactional email | Use the provider selected in `docs/TECH_CARD.md` unless a formal decision changes it. |
| Attachments         | Store attachments through Drive.                                                      |
| Import              | Initial import limits must be approved before implementation.                         |

### Notifications

| Area            | Decision                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------- |
| Engine          | Notifications are a dedicated module, not scattered helpers.                                |
| Source of truth | DB stores notification rules, jobs, delivery attempts and read state.                       |
| Delivery        | Use BullMQ for channel delivery, retry and deduplication.                                   |
| Realtime        | Socket.io only refreshes in-app UI state.                                                   |
| Channels        | In-app, email, Telegram internal and WhatsApp external via the Messenger/WAHA adapter path. |

### Calendar

| Area          | Decision                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| MVP           | Internal calendar only.                                                                                        |
| Main layers   | Meetings, delivery deadlines and personal items.                                                               |
| Module dates  | Support SLA, finance due dates and detailed task dates stay owned by their modules unless explicitly promoted. |
| External sync | Google Calendar sync is later work.                                                                            |

### Dashboard And Reports

| Area         | Decision                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Dashboard    | Dashboard is a lightweight control center, not a BI system.                                     |
| Reports      | Reports read module projections and must not duplicate business logic.                          |
| Exports      | Heavy exports and scheduled reports use BullMQ and Drive snapshots.                             |
| Missing data | Show data-quality warnings or missing state; never fake zero values.                            |
| Cache        | Use simple refresh/cache in MVP; live widgets are later unless required by a specific workflow. |

### Technical Infrastructure

| Area       | Decision                                                                             |
| ---------- | ------------------------------------------------------------------------------------ |
| Scope      | Track technical assets, deployments, incidents and infrastructure metadata.          |
| Secrets    | Link to Credentials; do not store secrets directly in Technical Infrastructure.      |
| Incidents  | Link incidents to Support where customer/team action is required.                    |
| Monitoring | Sentry and hosting metrics are the baseline; deeper integrations can be added later. |

## Open Decisions To Close Before Implementation

These items are not blockers for every module, but must be closed before the affected implementation slice:

- Transactional email provider consistency if docs mention different providers.
- Mail initial import limits: date range, message count, attachment size and retry policy.
- Credentials step-up depth: password re-auth only, 2FA, or both.
- Finance FX source and exact functional amount storage policy.
- Notification deduplication windows and escalation rules.
- Drive retention and export cleanup periods.
- Dashboard cache refresh intervals for production.
- Bank, government invoice, Google Calendar, Google Drive and Meta API integrations if pulled into MVP.

## Implementation Rule

Before implementing a module, confirm:

1. The module follows the global technical rules.
2. Module-specific decisions above are reflected in the code design.
3. Any open decision that affects the slice is resolved.
4. Missing linked modules or integrations have safe fallback behavior.
