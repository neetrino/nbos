# Slice 10 — Finance, Support and attention routing

Status: VERIFIED

Independent XHigh review (falsification / adversarial / invariant-first) on the uncommitted Slice 10 tree above HEAD `1970bfd6`. MASTER re-ran the Slice 10 suite (**840 passed, 5 skipped**) and Slice 5/7/8/9 regressions (**19 passed**). No unresolved Critical/High/Medium findings. Slices 8–9 remain `VERIFIED`. Slice 11 is **not** started (hard stop). No DROP. No production migrate.

## Canonical decisions

- `M-WA-05` — automation resolves destination by Product + purpose FINANCE (WORK fallback)
- `M-ROUTING-01` — access ≠ attention; additive attention ownership
- `M-SUPPORT-01` — Ticket is an internal case; client messages are referenced, not copied
- `M-CLIENT-01` — client-visible communication stays on Client Messenger
- `M-BOUNDARY-01` — binding / WhatsApp group template ≠ conversation ACL
- `M-CORE-01` — database is source of truth; persist before provider dispatch

## Scope

Connect Finance reminders, Support Ticket source references, and attention routing to canonical Client conversations. No Finance Messenger. No Public/Internal Ticket composer. No duplicate message universes.

Out of scope: Slice 11 search/realtime/cleanup/DROP, production migrate, WAHA, weakening Slice 5 Task discussion, Slice 7 locked composer, Slice 8 HMAC/outbox, Slice 9 resolver.

## How it works

### Finance reminders

Finance still owns timing and copy (`InvoiceCardRemindersService`, overdue waves, subscription payment window, CSR/hosting/domain/maintenance invoices that already flow through those jobs).

Messaging Core owns destination, persist, send, and history:

1. `resolveInvoiceProductWhatsAppGroup` → `resolveClientDestination(productId, FINANCE)` (explicit FINANCE else WORK).
2. `deliverFinanceClientReminder` persists a SYSTEM OUTBOUND Core message, then Slice 8 `core_client_send` outbox.
3. Client replies stay in that physical conversation.
4. Official/tax accountant send stays `accountingGroupChatId` via `InvoiceOfficialWhatsAppService`. Not collapsed into Product FINANCE.
5. Manual employee Finance chat is ordinary Client Messenger (invite READ_ONLY). Scheduler does not use it.

Notification job payloads may still record `whatsappGroupChatId` for audit. Live send is Core persist + `core_client_send`, not a parallel `payment_reminder` enqueue on raw `chatId`.

**FIX FINDING-S10-02:** Core persist (idempotent) runs before `NotificationJob` insert. `already_sent` requires an existing Core message; a job without Core is not treated as sent. Persist errors are not swallowed; retry persists.

### FINANCE default access template

Used only when **creating** a dedicated FINANCE WhatsApp group (`resolveFinanceTemplateParticipants`):

- Platform Owner, CEO, Finance Director, relevant Seller, relevant Product PM
- Developers / other Product members are not added
- Template members are WhatsApp group participants only. Core ACL is unchanged (binding ≠ SEND). CEO SEND is not stripped by auto READ_ONLY Core rows.

Selecting an existing FINANCE group does not re-apply the template.

### Support

- Ticket remains the internal case/SLA entity. Execution Tasks use existing Slice 5 access.
- Create/link Ticket from Client messages when `CLIENT_MESSAGE_ACTION_HOOKS.createTicket` and `SUPPORT_TICKETS.ADD`.
- `TICKET_SOURCE` references follow the Slice 6 pattern. History is not copied into a Ticket chat.
- Ticket detail lists source references. Preview / Open original require Client READ on the source conversation.
- Product on create infers `projectId` when omitted (`resolveSupportTicketProjectId`).
- No Public/Internal Ticket composer exists or was added.

### Attention (M-ROUTING-01)

Defaults are computed at read time. `MessengerConversationAttention` stores **manual overrides only**. Unique `(conversationId, productId, purpose)`. Conversation id does not change.

| Binding                                                                                                                                          | Default owner                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| WORK + Hub Maintenance formula false (Delivery, including `DONE` with no live maintenance subscription)                                          | ROLE `PRODUCT_PM` (current `product.pmId`) |
| WORK + Hub Maintenance formula true (`Subscription.type` ∈ { `MAINTENANCE_ONLY`, `DEV_AND_MAINTENANCE` } and `status` ∈ { `PENDING`, `ACTIVE` }) | QUEUE `SUPPORT_INTAKE`                     |
| FINANCE                                                                                                                                          | QUEUE `FINANCE`                            |

There is no `maintenanceMode` on Product. `Product.status DONE` is delivery Closed, not Maintenance. Messenger uses `product-maintenance-view.ts` (Hub formula next to delivery lifecycle); conversation id does not change.

Queue membership: employees with **EDIT ALL** on `SUPPORT_TICKETS` (Intake) or `FINANCE_INVOICES` (Finance). Invoice **VIEW ALL** (Product PM Read) is not the Finance working queue. No hard-coded employee owner. Access ≠ attention (M-ROUTING-01); queue membership does not grant Client READ/SEND. Finance Director seed `MESSENGER: N` is unchanged.

`PATCH /api/messenger/core/client/conversations/:id/attention` reassigns without changing conversation id. Requires Client WRITE or SEND (not READ_ONLY). QUEUE must be Support Intake or Finance; ROLE is Product PM (`product.pmId` at read time); EMPLOYEE must be a conversation participant or queue member. Selecting Product PM restores the computed default when that default is Product PM (deletes the override). Client list `assigned` filter uses a dedicated attention query, not a post-filter of the newest `pageSize*5` chats. Shared conversation UI PATCHes/displays the viewed product+purpose; list/header labels use `.some()`-consistent unique labels.

**FIX FINDING-S10-01:** ROLE overrides resolve `product.pmId` at read time. UI Product PM restores default when it matches. Assigned includes the PM after Intake → Product PM. Client Inbox list include reuses `ATTENTION_PRODUCT_SELECT` (subscription `type`+`status`); `attentionsFromListRow` uses the Hub formula. Product.status is not selected for this decision.

**FIX FINDING-S10-03:** Assign/header/list no longer use `attention[0]` silently. Scope select for shared product+purpose; labels joined. `attachTicketSources` keeps Support ADD (controller), ticket existence, and source Client READ. It does not call Internal `MESSENGER.EDIT`. `attachTaskSources` is unchanged.

**FIX FINDING-S10-04:** Attention PATCH requires WRITE/SEND; ownerKind validated.

**FIX FINDING-S10-05:** Assigned loads by attention match, then pages the matching set.

**FIX FINDING-S10-06:** Maintenance WORK default uses the Hub subscription formula (`MAINTENANCE_ONLY` / `DEV_AND_MAINTENANCE` + `PENDING` / `ACTIVE`), not `Product.status DONE`. Assigned default query uses the same helper. `DONE` without a live maintenance subscription stays Product PM. Conversation id is unchanged.

**FIX FINDING-S10-07:** WhatsApp outbound worker logs and skips leftover `payment_reminder` / `overdue_reminder` jobs (no Gateway `sendTextMessage`). `official_send` / `official_cancel` and `core_client_send` are unchanged.

**FIX FINDING-S10-08:** Finance (and Support Intake) attention queues use module **EDIT ALL**, not VIEW ALL. Seed RBAC is unchanged; Finance Director does not gain Messenger via attention or queue membership.

## Schema (additive only)

Migration: `packages/database/prisma/migrations/20260901010000_messenger_attention_routing/migration.sql`

Adds:

- enums `MessengerAttentionOwnerKind`, `MessengerAttentionQueue`, `MessengerAttentionRole`
- table `messenger_conversation_attentions`

Does not DROP `ProductWhatsAppGroupBinding`, Channel/DM, Task discussion, or Meta.

## HTTP

- `PATCH /api/messenger/core/client/conversations/:id/attention` — Client WRITE or SEND, then upsert or restore-default
- `POST /api/messenger/core/messages/ticket-sources` — `SUPPORT_TICKETS` ADD; source Client READ; not Internal EDIT; references only
- `GET /api/messenger/core/tickets/:ticketId/source-messages` — Ticket VIEW; preview null without source Client READ

## Tests

Required coverage:

- reminder routing with and without explicit FINANCE (`messenger-finance-reminder.ops.test.ts`)
- shared FINANCE conversation, per-product Finance queue attention (`messenger-core-slice-10.ops.test.ts`)
- manual finance participant READ without SEND (`messenger-core-finance-read-only.test.ts`)
- Delivery → Maintenance (Hub subscription formula) changes attention, not conversation id (same file)
- Ticket source preview gated on Client READ (same file)
- PATCH attention requires WRITE/SEND; ownerKind validated (`messenger-core-client.service.test.ts`, `messenger-core-attention-assign.ops.test.ts`)
- Product PM ROLE resolves `product.pmId`; Intake → Product PM round-trip (`messenger-core-slice-10.ops.test.ts`)
- Assigned query is not a newest-500 post-filter (`messenger-core-client-list-assigned.ops.test.ts`)
- Assigned Intake match uses Hub subscription `some`/`none`, not `status DONE` (same file)
- Shared attention UI does not PATCH `attention[0]` (`client-attention-view.test.ts`, Client Messenger web scan)
- Overdue persist-first; job without Core is not `already_sent` (`invoice-overdue-reminders.service.test.ts`)
- Hub maintenance helper: live types/statuses vs ON_HOLD/CANCELLED/COMPLETED/DEV_ONLY (`product-maintenance-view.test.ts`)
- Worker process of `payment_reminder` / `overdue_reminder` does not call `sendTextMessage` (`whatsapp-outbound-messages.worker.test.ts`)
- FINANCE_INVOICES VIEW ALL without EDIT ALL is not Finance queue membership (`messenger-core-attention-queue.ops.test.ts`)
- Client Inbox list Hub formula via list include / `attentionsFromListRow` (`messenger-core-client-list-attention.test.ts`)
- Ticket source attach without Internal MESSENGER.EDIT; source READ still required (`messenger-core-ticket-source-attach.test.ts`)

Command (152 files passed, 1 skipped; 840 tests passed, 5 skipped):

```text
pnpm test -- apps/api/src/modules/finance apps/api/src/modules/support apps/api/src/modules/messenger apps/web/src/features/messenger-client apps/web/src/features/support apps/web/src/features/projects apps/api/src/modules/projects/product-maintenance-view.test.ts apps/api/src/modules/integrations/whatsapp-gateway/product-whatsapp-finance-participants.ops.test.ts apps/api/src/modules/integrations/whatsapp-gateway/whatsapp-outbound-messages.worker.test.ts
```

ESLint on touched API/web files passed. Full typecheck / browser E2E not run.

## Residual (LOW — non-blocking)

- Create Ticket dialog still shows Project/Product pickers; Client path keeps conversation Product and no-ops picker callbacks.
- Deep-link `?conversation=` opens Client Messenger; Next `useSearchParams` is used without an extra Suspense boundary (same pattern as other app pages).
- Notification payloads still include `whatsappGroupChatId` for job audit; send path is Core.
- Manual attention to a named employee is API-capable (`ownerKind=EMPLOYEE`) only for participants or queue members; Client UI currently reassigns queues / Product PM only.
- `viewedAttention` still falls back to `attention[0]` when product scope is missing; list/header labels and the assign selector do not silently PATCH only `[0]`.
- Unlinking a ticket source still requires Internal `MESSENGER.EDIT`; attach does not.
- `send_failed` skip reason is returned when overdue Core persist throws; NotificationJob is not created in that case.
- Production migrate not run. Browser E2E of Client Ticket / attention assign was not run. Full API `tsc --noEmit` was not used as a Slice 10 gate (pre-existing errors outside this slice).
- A Product PM whose role also has `SUPPORT_TICKETS` EDIT ALL still appears in Support Intake Assigned (working-support proxy). Invoice VIEW ALL alone does not put them on the Finance queue. Do not auto-grant Client READ via attention (M-ROUTING-01). Finance Director seed remains `MESSENGER: N`.
- Stale Redis `payment_reminder` / `overdue_reminder` jobs are skipped (logged no-op); they are not Gateway-sent.

## Status

VERIFIED

Hard stop: do **not** start Slice 11, destructive cleanup, or extra Messenger features without an explicit user instruction.
