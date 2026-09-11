# Slice 0 — Baseline, inventory and migration safety

Status: VERIFIED

## Canonical decisions

Inventory constraints (not implemented in this slice):

- `M-CORE-01`, `M-TASK-01`, `M-TASK-02`, `M-CLIENT-01`, `M-MAIL-01`
- `M-WA-01` through `M-WA-05`, `M-WHATSAPP-01`
- `M-BOUNDARY-01`, `M-BOUNDARY-02`
- `M-FILES-01`, `M-SECURITY-01`, `M-SECURITY-02`

No Canon conflict was found between Master Canon and Decision Register. Historical docs that contradict Canon are classified below; they do not override verified runtime.

## Scope

Establish a fresh runtime baseline on latest `origin/main` before any Messenger product-code change.

Out of scope: Slices 1–11 implementation, data migration, table drops, schema changes, Client/Internal rebuild, Gateway rewrite.

## Existing runtime / migration notes

See **Runtime discoveries**, **Classification map**, and **Ordered migration dependencies**.

## Implementation requirements

Slice 0 is inventory-only. Product behavior must remain unchanged.

## Data migration / rollback

No data was migrated. No schema was changed. Later slices must follow:

```text
inventory → additive schema → idempotent backfill → parity → switch writes → switch reads
  → observation → disable legacy writes → verification → destructive cleanup last
```

## Tests / negative tests

See **Commands executed**, **Tests and results**, and **Negative tests / adversarial disproofs**.

---

## Implementation result

### Commit / ref inventoried

- Branch created: `feat/messenger-slice-00-baseline` from latest `origin/main`
- Inventoried SHA: `302f57f7e6b13f7a1acdc3c09e027549389fbabe`
- Message: `Merge pull request #250 from neetrino/sipan`
- `HEAD` == `origin/main` at inventory start (working tree clean)

### Files inspected (not only files changed)

**Canon / process**

- `00-Messenger-Master-Canon.md`
- `08-Messenger-Decision-Register.md`
- `09-Messenger-Cross-Module-Canon.md`
- `10-Messenger-Runtime-Reconciliation.md`
- `11-Messenger-Rebuild-Implementation-Checklist.md` (Slice 0 + global gates + status table)
- `12-Messenger-Rebuild-Execution-Strategy.md`
- `06-Messenger-Cleanup-Register.md`
- `07-Internal-Messenger-Implementation-Progress.md` (status only)
- `00-Messenger-Overview.md`, `01-Internal-Messenger.md`, `02-External-Messenger-and-CRM-Inbox.md`
- `03-Messenger-Architecture.md`, `04-Messenger-Integrations.md`, `05-Messenger-Permissions-and-UX.md`
- `13-Messenger-Documentation-Consistency-Review.md`, `90-Messenger-Final-Acceptance.md`

**Schema / migrations / seed**

- `packages/database/prisma/schema/messenger.prisma`
- `packages/database/prisma/schema/tasks.prisma`
- `packages/database/prisma/schema/whatsapp.prisma`
- `packages/database/prisma/schema/support.prisma`
- `packages/database/prisma/schema/drive.prisma` (FileAsset messenger attachment relations)
- `packages/database/prisma/schema/employees.prisma` (Unified relations)
- `packages/database/prisma/migrations/20260804120000_messenger_unified_conversation_foundation/migration.sql`
- `packages/database/prisma/migrations/20260713180000_whatsapp_product_group_automation/migration.sql`
- `packages/database/prisma/migrations/20260825180000_whatsapp_accounting_group_chat_id/migration.sql`
- `packages/database/prisma/seed.ts`, `seed-messenger.ts`, `seed-rbac.ts`

**Messenger runtime**

- `apps/api/src/modules/messenger/**` (service, controller, gateway, ACL, attachments, unread/read)
- `apps/web/src/app/(app)/messenger/page.tsx`
- `apps/web/src/features/messenger/**`
- `apps/web/src/lib/api/messenger.ts`
- `apps/web/src/features/clients/components/client-portfolio/PortfolioMessengerSheet.tsx`
- `packages/shared/src/constants/messenger-ws.ts`

**Tasks**

- `apps/api/src/modules/tasks/task-discussion.service.ts` (+ controller, rules, tests)
- `apps/api/src/modules/tasks/create-task.op.ts`, `task-response-includes.ts`, `tasks.service.ts`
- `apps/web/src/features/tasks/components/use-task-discussion.ts`
- `apps/web/src/features/tasks/components/TaskSheetChatPanel.tsx`
- `apps/api/src/modules/ai-platform/mcp/agent-mcp.tools.ts`
- `apps/api/src/modules/ai-platform/gateway/agent-task-read.handler.ts`

**WhatsApp / Deal Won / Product settings**

- `apps/api/src/modules/integrations/whatsapp-gateway/**`
- `apps/api/src/modules/crm/deals/deal-won-whatsapp.ts`, `deal-won-whatsapp-action.ts`
- `apps/web/src/features/projects/product-whatsapp-settings.ts` (+ ProductWhatsApp\* UI)
- `apps/web/src/features/crm/deal-won-whatsapp-gate.ts`

**Finance send paths**

- `invoice-product-whatsapp-resolve.ts`
- `invoice-overdue-reminders.service.ts`
- `invoice-card-payment-window-reminders.ts`
- `invoice-card-reminders.service.ts`
- `invoice-official-whatsapp.service.ts`
- `invoice-payment-reminder-whatsapp.ts`

**Support / Meta**

- `packages/database/prisma/schema/support.prisma`
- `apps/web/src/features/support/components/SupportTicketDetailSheet.tsx`
- `apps/web/src/features/support/components/support-ticket-detail-activity-tab.tsx`
- `packages/database/prisma/schema/integrations.prisma` (`MetaConversation`, `MetaMessage`, `MetaSenderIdentity`, `MetaConnectedAccount`, `MetaProviderEvent`)
- `packages/database/prisma/schema/crm.prisma` (`Lead.metaConversation`, `onDelete: SetNull` on `leadId`)
- `packages/database/prisma/migrations/20260710120000_meta_identity_conversation_messages/migration.sql`
- `apps/api/src/modules/integrations/meta/meta.controller.ts`, `meta-webhook.service.ts`, `meta-lead-ingest.service.ts`
- `apps/api/src/modules/integrations/meta/meta-lead-attach.ops.ts`, `meta-graph.client.ts`
- `apps/api/src/modules/crm/leads/leads.service.ts`, `lead-merge-relations.ops.ts`
- `apps/web/src/features/crm/components/LeadGeneralTab.tsx`, `apps/web/src/features/crm/utils/crm-entity-display.ts`

### Files changed

- `docs/NBOS/02-Modules/09-Messenger/20-Slice-00-Baseline.md` (this file)
- `docs/NBOS/02-Modules/09-Messenger/10-Messenger-Runtime-Reconciliation.md`
- `docs/NBOS/02-Modules/09-Messenger/11-Messenger-Rebuild-Implementation-Checklist.md`
- `docs/NBOS/02-Modules/09-Messenger/07-Internal-Messenger-Implementation-Progress.md`
- `docs/NBOS/02-Modules/09-Messenger/06-Messenger-Cleanup-Register.md`

No product TypeScript/schema/migration files changed.

### Schema / migrations inspected

None added. None applied. None dropped.

### Implementation decisions (inventory only)

1. Do not “fix” the stale Unified-as-UI-source-of-truth comment in `messenger.prisma`. Record it as a documentation/runtime defect. Slice 1 owns Core selection.
2. Do not add a committed inventory script. Counts were taken with a one-off count-only Prisma client (`count` / `groupBy` / distinct id length only) and the temp file was deleted.
3. Empty Channel/DM row counts do **not** classify those stores as unused: the live service still writes them.
4. Empty Unified row counts plus zero production TS callers classify Unified as schema remnant, not active source of truth.
5. `Task.chatId` is an unused leftover unique column, not a Task Conversation pointer.
6. Accountant `accountingGroupChatId` is a distinct destination class from Product `groupChatId`. Do not collapse them.
7. Prefer evolving the existing Unified generation as the candidate Core in Slice 1 **if** contracts can match Canon, because Channel/DM is a split store and Unified already has participants/links/replies/settings. This is a planning recommendation, not a Slice 0 schema change. Slice 1 must still refuse a third permanent store.
8. Empty `MetaConversation` / `MetaMessage` rows do **not** classify Client Sales history as `NEW`: live inbound writers exist (`MetaLeadIngestService`). Same rule as Channel/DM and `TaskDiscussionEntry`. Mail (`M-MAIL-01`) is a separate exemption; Meta does not inherit it. Do not create a third/fourth permanent Messenger store for Meta in later slices.

---

## Runtime discoveries

### A. Active writes are Channel/DM; Unified has no production TS callers — PROVEN

Active Prisma paths: `prisma.messengerChannel*`, `prisma.messengerDirect*`.

`MessengerService.sendMessage` / `sendDirectMessage` persist with `.create` then emit Socket.IO (`persist-before-emit`).

Search `prisma.messengerConversation` in `*.{ts,tsx}`: **no production matches**. Unified models appear in Prisma schema, `employees.prisma` relations, Drive `FileAsset` relation, and unused WS constant names in `packages/shared/src/constants/messenger-ws.ts` (`messenger.subscribe_conversation`, `messenger.conversation.message`). Gateway/UI do not subscribe to those events.

### B. `messenger.prisma` Unified UI comment is stale — PROVEN (docs/runtime defect)

```131:133:packages/database/prisma/schema/messenger.prisma
// ─── UNIFIED INTERNAL MESSENGER ────────────────────────────
// Unified conversation tables are the Internal Messenger UI source of truth.
// Legacy channel/DM tables remain for compatibility until write-freeze + verified retirement.
```

Mounted UI at `/messenger` is `MessengerClient` → Channel + DM APIs only. Do not change product architecture to match this comment.

### C. `Task.chatId` is unused by Tasks API — PROVEN

- Schema: `Task.chatId String? @unique`
- `apps/api/src/modules/tasks/**`: **zero** `chatId` references
- `create-task.op.ts` insert does not set `chatId`
- Web `Task` DTO includes `chatId: string | null` (leftover scalar from Prisma include); tests stub `null`
- WhatsApp `chatId` in finance/gateway is a **provider JID**, unrelated to `Task.chatId`
- DB: `taskWithChatId = 0` of 390 tasks

Do not treat `Task.chatId` as the canonical Task Conversation. Slice 5 must not reuse it as a MessengerConversation id without a new mapping table.

### D. Finance client reminders send via Product `groupChatId` + outbound worker — PROVEN

Resolver: `resolveInvoiceProductWhatsAppGroup` → `ProductWhatsAppGroupBinding` where `status === ACTIVE` and `groupChatId` present. Product preference: Subscription → Client Service Record → Order. Never Project-level.

Send: `tryDeliverPaymentReminderWhatsApp` → `WhatsAppOutboundQueueService` → worker `POST /api/messages/send`.

Used by:

- `invoice-overdue-reminders.service.ts` (`kind: overdue_reminder`)
- `invoice-card-payment-window-reminders.ts` (`kind: payment_reminder`, Subscription pay-window)
- Client Service invoices use the same resolver when CSR has `productId`

This is **not** Messaging Core. Classification: `MIGRATE` destination in Slice 9–10; `REUSE` outbound worker/idempotency.

### E. Official invoices use `accountingGroupChatId` — PROVEN (different destination class)

`InvoiceOfficialWhatsAppService.requireAccountingGroupChatId()` reads `WhatsAppGatewayConnection.accountingGroupChatId` (company Settings → Integrations). Not Product WORK/FINANCE.

`invoice-card-reminders.service.ts` official-request jobs may **record** Product `groupChatId` in notification payload, then `enqueueIfAwaitingEligible` **sends** to the accountant group. Do not collapse accountant vs Product client destinations.

### F. No WhatsApp inbound webhook in NBOS whatsapp-gateway module — PROVEN

`apps/api/src/modules/integrations/whatsapp-gateway/**`: **zero** `webhook` matches.

`WhatsAppGatewayController` exposes GET/PUT connection, chats/groups, test, disconnect. Outbound-only from NBOS.

Meta `GET/POST /integrations/meta/webhook` is **not** WhatsApp Gateway inbound and **not** Messaging Core. It is a live CRM + conversation persist path (`MetaWebhookService` → `MetaLeadIngestService.ingestMessage`). See discovery **H**.

### G. Client Messenger surface does not exist; `/messenger` is Channel+DM — PROVEN, with mixed-UI remnant

- Route: `apps/web/src/app/(app)/messenger/page.tsx` → `MessengerClient`
- Lists: Channels + Direct Messages
- Placeholder **Internal | External** toggle exists (`setZone('internal' | 'external')`). External pane is copy-only (“not connected yet”) and still mentions historical `WhatsAppWebAdapter -> WAHA` plus “CRM Inbox, Project WhatsApp Groups, Support and Finance”
- `PortfolioMessengerSheet` embeds the same Internal Channel/DM client
- No Client Inbox/Sales/Clients surface, no locked Client composer

Classification: Client **UI** (`Inbox/Sales/Clients`) `NEW` (Slice 7); mixed toggle `DELETE-LATER` (Slice 7). Client Sales **history store is not NEW** — see discovery **H** (`MetaConversation` / `MetaMessage`, `MIGRATE`).

### Task Discussion real shape

Live store: `TaskDiscussionEntry` via `TaskDiscussionService.addEntry` / `listEntries`.

API: `GET/POST /api/tasks/:id/discussion`. MCP `nbos_get_task_discussion` → `tasks.read_discussion` → same `listEntries`.

Fields written: `taskId`, `body`, `visibility: STANDARD`, actor fields (`actorType`, `actorId`, `actorDisplayName`, optional `channelSource`, `correlationId`). No reply, no `editedAt`, no attachments on this table.

Task Card UI (`TaskSheetChatPanel`) renders discussion notes plus a **derived** activity timeline from Task `createdAt` / `updatedAt` / `completedAt`. That is not a separate Task Activity persistence model. Platform `auditLog` is also not Task Activity Feed. Target `M-TASK-02` Activity Feed remains Task-owned (`REUSE` as a **concept**: system activity, not human Message rows). A dedicated Activity Feed **store** is `VERIFY-MISSING` and must not be confused with these derived rows.

### Product WhatsApp uniqueness (blocks shared groups)

Schema + migration:

- `product_whatsapp_group_bindings.product_id` UNIQUE
- `product_whatsapp_group_bindings.group_chat_id` UNIQUE

Service also rejects bind when another Product already has the same `groupChatId` (`GROUP_ALREADY_ASSIGNED`). Available-group picker excludes taken ids.

DB on inventoried URL: 145 bindings, 143 with `groupChatId`, **143 distinct** group ids (current data is 1:1). Status: ACTIVE 143, FAILED 2. No `OUTCOME_UNKNOWN` / `NEEDS_RECONCILIATION` rows in this snapshot. Operations: 9 (SUCCEEDED 7, FAILED 2); types CREATE 2, BIND 1, SYNC 6. Participant sync rows: 10. Client invitations: 0.

Keep 1:1 constraints until Slice 9 cutover evidence.

### Deal Won

`validateDealWonWhatsAppGate`: PRODUCT/OUTSOURCE require existing `groupChatId`, in-flight CREATE op, or explicit `create` / `bind`. `applyDealWonWhatsAppAction` calls `ensureGroupForProduct` or `bindExistingGroup` **after** Product exists; Gateway failure is logged, not used to roll back Deal/Product (warn-only catch). `OUTCOME_UNKNOWN` is a first-class operation/binding status in schema; do not plan blind retry/create.

### Drive / RBAC / realtime

- Attachments: Channel/DM attachment rows reference `FileAsset`; send path `assertMessengerFileAssetsAttachable` (Drive `LINK`)
- Permissions used: `MESSENGER` `VIEW` / `ADD` (create channel) / `EDIT` (send). ACL helper: `messenger-legacy-channel-access.op.ts` (`MESSENGER_VIEW`, `MESSENGER_EDIT` scopes OWN/DEPARTMENT/ALL). There is **no** Client READ/SEND split.
- Socket.IO namespace `/messenger`; persist-before-emit on send; typing/presence/unread/read receipts on Channel/DM rooms

### Support

`SupportTicket` is case/SLA/coverage only. Detail UI: General + Activity (audit log). **No** public/internal composer, no ticket message store.

### H. MetaConversation / MetaMessage is a durable Client Sales inbound store — PROVEN

Canon: `M-CLIENT-01` (Sales includes Instagram/Facebook where connected), `M-CORE-01` (one message truth), `M-MAIL-01` (Mail stays a separate EmailThread/EmailMessage store; Meta does **not** inherit that exemption).

Schema (`integrations.prisma`):

- `MetaConversation` (`meta_conversations`): unique `(metaConnectedAccountId, senderIdentityId)`; optional unique `leadId`; `Lead` relation `onDelete: SetNull`
- `MetaMessage` (`meta_messages`): unique `(platform, metaConnectedAccountId, providerMessageId)`; enum `direction` `INBOUND | OUTBOUND`
- Also: `MetaConnectedAccount`, `MetaProviderSecret`, `MetaSenderIdentity`, `MetaProviderEvent` (`@@unique([provider, eventId])`)

Live inbound persist (`meta-lead-ingest.service.ts`): `metaSenderIdentity.upsert` → `metaConversation.upsert` → `metaMessage.create` with `direction: 'INBOUND'` → update `lastMessageAt` / `latestMessagePreview`; `metaProviderEvent` for idempotency. Webhook: `GET/POST /integrations/meta/webhook`.

CRM: `leads.service` includes `metaConversation`; `LeadGeneralTab` shows inbound summary; `crm-entity-display.ts` titles/previews. Lead merge (`lead-merge-relations.ops.ts` `reassignMetaConversation`): move `leadId` to survivor, or unlink (`leadId: null`) if survivor already has a conversation. Attach: `meta-lead-attach.ops.ts` (1:1 conversation per Lead).

**Outbound/send: absent.** Search `direction: 'OUTBOUND'` in `integrations/meta`: **no writes**. `MetaGraphClient` methods: OAuth token exchange, `fetchUserPages`, `subscribePageToWebhook` (POST `{pageId}/subscribed_apps`), `fetchMessagingUserProfile`. Graph POST is webhook _subscribe_, not message send. Schema `OUTBOUND` enum is unused. Classify Meta **send** `NEW` when Client SEND exists; persist must go through Messaging Core, not a fourth store.

Empty conversation/message/account rows do **not** license `NEW` for Sales history (same rule as Channel/DM and `TaskDiscussionEntry`). This snapshot: conversations/messages/accounts **0**; `MetaProviderEvent` **17** (webhook/idempotency writers without persisted threads — payloads not copied).

Later owning slice: **7** (Client Sales identity + map Meta threads into Core Client zone). Slice **8** is WhatsApp Gateway; do not treat Meta cutover as Slice-8-only. **DELETE-LATER** Meta conversation/message tables in Slice **11** after 7 `VERIFIED`. Do not drop Meta because Core does not exist yet. Do not create a third/fourth permanent Messenger store for this path.

### Seed wipe risk

`packages/database/prisma/seed.ts` and `seed-messenger.ts` `deleteMany` Channel/DM tables (seed does **not** delete Unified tables, Meta tables, or WhatsApp bindings). `seed.ts` `lead.deleteMany()` SetNulls `MetaConversation.leadId` / `MetaProviderEvent.leadId`; it does **not** `deleteMany` `meta_conversations` / `meta_messages` / `meta_connected_accounts` / `meta_provider_events`. Running seed against a non-dev database would wipe Internal Messenger Channel/DM history and unlink Meta threads from Leads. Current inventoried Channel/DM and Meta conversation counts are already 0; WhatsApp bindings would survive messenger seed but not a full `seed.ts` product cascade.

---

## Classification map

| Area                                                   | Owner module now                     | Current source of truth                          | Later slice                            | Label                                                       | Rollback if later slice fails                                    |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Channel + ChannelMessage + attachments + read state    | Messenger API/UI                     | `messenger_channel*`                             | 1 map, 3 UI, 11 drop                   | `REUSE/EXTEND/MIGRATE` then `DELETE-LATER`                  | Keep Channel writes until Core parity                            |
| Direct thread + DM messages + attachments + read state | Messenger API/UI                     | `messenger_direct*`                              | 1 map, 3 UI, 11 drop                   | `REUSE/EXTEND/MIGRATE` then `DELETE-LATER`                  | Keep DM writes until Core parity                                 |
| Unified Conversation* / Message* / settings            | Schema only                          | Tables exist; **no runtime callers**; **0 rows** | 1 (candidate Core) or 11               | `SELECTIVE REUSE` / `DELETE-LATER` if unused after Slice 1  | Do not drop until Slice 1 choice + empty-or-migrated proof       |
| Unused WS conversation event names                     | shared constants                     | Dead relative to gateway                         | 1 or 11                                | `DELETE-LATER` or `EXTEND` if Core uses them                | Harmless leftover                                                |
| Stale Unified schema comment                           | prisma comment                       | Contradicts UI                                   | 1 (comment fix with Core cutover)      | docs defect; not product fix in Slice 0                     | N/A                                                              |
| Internal `/messenger` Channel+DM UI                    | web messenger                        | Channel/DM APIs                                  | 3                                      | `EXTEND/REPLACE`                                            | Keep route until Internal surface ships                          |
| Internal \| External toggle                            | `MessengerClient.tsx`                | Placeholder External pane                        | 7                                      | `DELETE-LATER`                                              | Removing early would not remove a real Client product            |
| Client Messenger Inbox/Sales/Clients **UI**            | absent                               | —                                                | 7                                      | `NEW` (surface only)                                        | N/A                                                              |
| MetaConversation + MetaMessage (IG/FB inbound history) | Meta/CRM                             | `meta_conversations` / `meta_messages`           | 7 map into Core Client Sales, 11 drop  | `MIGRATE` then `DELETE-LATER`                               | Keep inbound writes until Slice 7 VERIFIED; 0 rows here ≠ unused |
| MetaConnectedAccount / secret / sender identity        | Meta                                 | those tables                                     | 7 map to ExternalChannelAccount analog | `REUSE/EXTEND`                                              | Keep OAuth + webhook subscribe                                   |
| MetaProviderEvent                                      | Meta                                 | `meta_provider_events`                           | 7 map to Core provider events          | `REUSE/EXTEND`                                              | Idempotency; 17 rows this snapshot                               |
| Meta outbound send                                     | absent (enum unused)                 | —                                                | 7 when Client SEND exists              | `NEW` (persist in Core; not a fourth store)                 | N/A                                                              |
| CRM Lead inbound Meta summary UI                       | CRM                                  | reads `MetaConversation`                         | 7                                      | `REUSE` until Core Sales UI                                 | Keep Lead card until Sales reads Core                            |
| Mail EmailThread / EmailMessage                        | Mail                                 | separate mail store                              | never into Messenger                   | `KEEP` (`M-MAIL-01`); **not** a Meta exemption              | N/A                                                              |
| Collections PERSONAL/SHARED                            | absent                               | favorite flag only on Unified settings (unused)  | 3 / 7                                  | `NEW`                                                       | N/A                                                              |
| TaskDiscussionEntry                                    | Tasks                                | `task_discussion_entries`                        | 5 then 11                              | `MIGRATE` then `DELETE-LATER`                               | Keep writes until Slice 5 VERIFIED                               |
| Task.chatId                                            | Tasks schema leftover                | unused unique column; 0 rows                     | 5 (do not reuse blindly)               | `DELETE-LATER`                                              | Unused; dropping early still needs a migration                   |
| Task Activity (target feed)                            | Tasks UI derived + audit elsewhere   | Not a discussion table                           | 5 must keep separate                   | `REUSE` concept / `VERIFY-MISSING` dedicated store          | Do not convert discussion or audit into Messages                 |
| Product + Connected Work Space one conversation        | not implemented in Messenger         | No Product/Workspace chat ids in Channel/DM      | 4                                      | `NEW` (+ reconcile if duplicates appear later)              | N/A today                                                        |
| ProductWhatsAppGroupBinding 1:1                        | WhatsApp/Product                     | `product_whatsapp_group_bindings`                | 9 then 11                              | `MIGRATE` then `DELETE-LATER` constraints                   | Keep uniques until Slice 9 parity                                |
| WA operations / participant sync / invites             | WhatsApp                             | those tables                                     | 9                                      | `REUSE/EXTEND`                                              | Preserve ops history                                             |
| Deal Won create/bind/gate                              | CRM + Product WhatsApp               | binding + operations                             | 9                                      | `REUSE/EXTEND`                                              | Keep current gate semantics                                      |
| Product Client Communication settings UX               | web projects                         | binding + gateway groups                         | 9                                      | `REUSE/EXTEND`                                              | Keep select/paste/replace                                        |
| Finance client reminders                               | Finance invoices                     | Product `groupChatId` → outbound queue           | 10 (resolver Slice 9)                  | `MIGRATE` destination; `REUSE` worker                       | Keep raw group send until resolver cutover                       |
| Official invoice WhatsApp                              | Finance + Gateway connection         | `accountingGroupChatId`                          | 10                                     | `EXTEND/MIGRATE` (company destination, not Product FINANCE) | Keep accountant group                                            |
| Subscription / CSR reminders                           | Finance (via invoice + product link) | same Product group resolver                      | 10                                     | `MIGRATE` with Finance                                      | Same as client reminders                                         |
| Support Ticket                                         | Support                              | ticket + audit                                   | 10                                     | `REUSE/EXTEND` (no parallel chat)                           | N/A                                                              |
| WhatsApp Gateway HTTP client / outbound queue          | integrations                         | Gateway HTTPS + BullMQ                           | 8                                      | `REUSE/EXTEND`                                              | Do not replace Gateway                                           |
| Gateway inbound webhook in NBOS                        | absent                               | —                                                | 8                                      | `NEW` (consume existing Gateway contract)                   | N/A                                                              |
| Drive FileAsset attachments                            | Drive + Messenger                    | FileAsset ids on Channel/DM (Unified unused)     | 1                                      | `REUSE`                                                     | Keep Drive ownership                                             |
| Messenger RBAC VIEW/ADD/EDIT                           | RBAC                                 | module permissions                               | 2                                      | `REUSE/EXTEND` (add Client READ/SEND)                       | Keep current Internal ACL until Slice 2                          |
| L1/L2 Topics / MessengerTopic                          | absent in schema/code                | —                                                | never                                  | `DO NOT RETURN`                                             | N/A                                                              |
| Telegram two-way chat sync                             | absent in TS                         | —                                                | never                                  | `DO NOT BUILD`                                              | N/A                                                              |
| seed Channel/DM deleteMany                             | seed                                 | demo reset                                       | ops discipline                         | `KEEP` as seed-only; never run on prod data                 | Could wipe Messenger history                                     |

---

## Ordered migration dependencies

```text
0  Baseline (this slice)
1  Messaging Core (choose/evolve one store; map Channel/DM; no third store)
2  Permissions / Internal vs Client boundary (READ != SEND)
3  Internal surface on Core (retire mixed daily UX later with 7)
4  Product / Work Space / Deal entity conversations
5  TaskDiscussionEntry → Core (keep table until verified)
6  Message references / Create Task
7  Client surface + map MetaConversation/MetaMessage into Core Client Sales (do not classify Sales history NEW)
8  Gateway inbound + outbound through Core (WhatsApp; Meta inbound already persists in Meta tables until 7)
9  ProductCommunicationBinding WORK/FINANCE (keep 1:1 uniques until then)
10 Finance/Support routing onto Client conversations
11 Search/notifications hardening; destructive cleanup last (incl. Meta conversation/message tables after 7)
```

Special rules encoded for later slices (not executed):

- Channel/DM cannot be dropped before Core parity even if this DB snapshot is empty
- Unified is not source of truth merely because tables exist (here: 0 rows, 0 callers)
- `TaskDiscussionEntry` stays until Slice 5 cutover evidence (here: 0 rows, live writes)
- `MetaConversation` / `MetaMessage` stays until Slice 7 cutover evidence (here: 0 conversation/message rows, live inbound writers; `MetaProviderEvent` 17)
- Mail exemption (`M-MAIL-01`) does not apply to Meta
- Do not drop Meta because replacement Core does not exist yet
- Do not create a third/fourth permanent Messenger store for Meta
- `ProductWhatsAppGroupBinding` 1:1 stays until Slice 9 cutover evidence
- Dual-write only if Slice 1 needs it: declare authoritative side, finite window, removal gate
- `OUTCOME_UNKNOWN` must never be planned as blind retry/create
- Physical WhatsApp groups must not be recreated for schema convenience
- FINANCE fallback to WORK is target resolver behavior, not current code

---

## DELETE-LATER items and owning slice

| Item                                                                   | Owning slice for removal                |
| ---------------------------------------------------------------------- | --------------------------------------- |
| `messenger_channels` and channel message/attachment/read tables        | 11 after 1+3                            |
| `messenger_direct_*` tables                                            | 11 after 1+3                            |
| Unified tables **if** Slice 1 does not evolve them as Core             | 11 after 1 proves unused                |
| Internal \| External UI                                                | 7                                       |
| External placeholder WAHA copy                                         | 7                                       |
| `TaskDiscussionEntry` + discussion write API                           | 11 after 5                              |
| `Task.chatId` column                                                   | 11 after 5 (or 5 additive ignore)       |
| `meta_conversations` / `meta_messages`                                 | 11 after 7                              |
| `product_id` / `group_chat_id` UNIQUE on bindings                      | 11 after 9                              |
| Raw Product `groupChatId` in finance senders                           | 10                                      |
| Stale schema comment calling Unified UI SOT                            | 1                                       |
| Unused conversation WS constants if unused after Core                  | 11                                      |
| Historical docs “1 Product = 1 group”, External→Support/Finance stores | docs UPDATE during 9–10, not drop-first |

---

## Commands executed

Git:

```text
git fetch origin main
git rev-parse HEAD
# 302f57f7e6b13f7a1acdc3c09e027549389fbabe
git checkout -b feat/messenger-slice-00-baseline
```

Static searches (ripgrep via workspace search; interpretation in discoveries):

| Pattern                                        | Result interpretation                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `prisma.messengerChannel`                      | Live in messenger service/ops + seeds                                                         |
| `prisma.messengerDirect`                       | Live in messenger service/ops + seeds                                                         |
| `prisma.messengerConversation`                 | No production TS callers                                                                      |
| `taskDiscussionEntry`                          | Live Tasks discussion service + tests + MCP                                                   |
| `chatId` under `apps/api/src/modules/tasks`    | No matches                                                                                    |
| `groupChatId`                                  | Product binding + finance client sends + Deal Won                                             |
| `accountingGroupChatId`                        | Gateway connection + official invoice send                                                    |
| `webhook` in `whatsapp-gateway/**`             | No matches                                                                                    |
| `prisma.metaConversation`                      | Live ingest upsert/update + lead merge/attach + tests                                         |
| `prisma.metaMessage` / `tx.metaMessage.create` | Live inbound create only (`direction: 'INBOUND'`)                                             |
| `meta_conversations`                           | Schema `integrations.prisma` + migration `20260710120000_meta_identity_conversation_messages` |
| `direction: 'OUTBOUND'` in `integrations/meta` | No writes (enum unused)                                                                       |
| Meta Graph send (`/messages`, `sendMessage`)   | Absent; Graph POST is `subscribePageToWebhook` only                                           |
| `setZone('external')`                          | Placeholder mixed UI in MessengerClient                                                       |
| `MessengerTopic` in ts/tsx/prisma              | No matches                                                                                    |
| `Internal \| External` in product TS           | No string match; buttons labeled Internal / External                                          |

Counts command (one-off, deleted after; count/groupBy only):

```text
cd packages/database
pnpm exec tsx prisma/_tmp_slice00_counts.ts
```

Temp script used `createPrismaClient` + `.count()` / `.groupBy()` / distinct `groupChatId` length. No `create`/`update`/`delete`. File removed so it is not a leftover Unified caller.

Meta recheck (one-off, deleted after):

```text
cd packages/database
pnpm exec tsx prisma/_tmp_slice00_meta_counts.ts
```

Count-only on `metaConversation`, `metaMessage`, `metaConnectedAccount`, `metaProviderEvent`, `metaSenderIdentity`. No bodies/secrets. File removed.

### Migration / parity evidence (counts)

Source: local `DATABASE_URL` from `.env` then `.env.local` override. Host/credentials not recorded. This is **not** labeled production vs staging in-repo; Task (390) and WhatsApp binding (145) counts show a non-empty operational database.

| Model / query                     | Count                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| MessengerChannel                  | 0                                                                          |
| MessengerChannelMessage           | 0                                                                          |
| MessengerChannelMessageAttachment | 0                                                                          |
| MessengerChannelReadState         | 0                                                                          |
| MessengerDirectThread             | 0                                                                          |
| MessengerDirectMessage            | 0                                                                          |
| MessengerDirectMessageAttachment  | 0                                                                          |
| MessengerDirectThreadReadState    | 0                                                                          |
| MessengerConversation             | 0                                                                          |
| MessengerConversationParticipant  | 0                                                                          |
| MessengerConversationLink         | 0                                                                          |
| MessengerMessage                  | 0                                                                          |
| MessengerMessageAttachment        | 0                                                                          |
| MessengerConversationReadState    | 0                                                                          |
| MessengerUserConversationSetting  | 0                                                                          |
| Task total                        | 390                                                                        |
| Task with chatId not null         | 0                                                                          |
| Task with discussion entries      | 0                                                                          |
| TaskDiscussionEntry               | 0                                                                          |
| ProductWhatsAppGroupBinding       | 145                                                                        |
| Binding status                    | ACTIVE 143, FAILED 2                                                       |
| Bindings with groupChatId         | 143                                                                        |
| Distinct groupChatId              | 143                                                                        |
| WhatsAppGroupOperation            | 9 (SUCCEEDED 7, FAILED 2)                                                  |
| Operation types                   | CREATE_PRODUCT_GROUP 2, BIND_EXISTING_GROUP 1, SYNC_PRODUCT_PARTICIPANTS 6 |
| ProductWhatsAppParticipantSync    | 10                                                                         |
| ProductWhatsAppClientInvitation   | 0                                                                          |
| WhatsAppGatewayConnection rows    | 1                                                                          |
| accountingGroupChatId present     | 1 (value not copied)                                                       |
| MetaConversation                  | 0                                                                          |
| MetaMessage                       | 0                                                                          |
| MetaConnectedAccount              | 0                                                                          |
| MetaSenderIdentity                | 0                                                                          |
| MetaProviderEvent                 | 17                                                                         |

Meta conversation/message/account counts rechecked with a second one-off script (`pnpm exec tsx prisma/_tmp_slice00_meta_counts.ts`, deleted after). Independent review had already observed 0/0/0 on conversation/message/account; this recheck matches. `MetaProviderEvent` 17 is additional (idempotency/skipped webhook rows; payloads not copied).

Do not claim production preservation of Channel/DM or Meta **history** beyond this environment: this snapshot has no Channel/DM/Unified/Task-discussion/Meta-conversation rows. WhatsApp Product bindings **are** populated and must be preserved. Empty Meta rows + live writers ⇒ `MIGRATE`, never silent `NEW`.

### Schema constraint inventory (shared-group blockers)

| Constraint                                          | Effect                                     |
| --------------------------------------------------- | ------------------------------------------ |
| `product_whatsapp_group_bindings_product_id_key`    | One binding row per Product                |
| `product_whatsapp_group_bindings_group_chat_id_key` | One Product per physical group id          |
| App `GROUP_ALREADY_ASSIGNED`                        | Same 1:1 rule on bind                      |
| `whatsapp_group_operations.dedupe_key` UNIQUE       | Keep for OUTCOME_UNKNOWN-safe ops          |
| `Task.chatId` UNIQUE                                | Unused; do not overload as conversation id |

### Tests and results

- No new automated tests added (no product code).
- Existing finance resolver tests already encode Product `groupChatId` resolution (Subscription vs CSR).
- Inventory verification = recorded searches + read-only counts.

Browser: not required; `/messenger` mount is `MessengerClient` in source (Channel+DM + External placeholder).

---

## Negative tests / adversarial disproofs

| Claim                                                | Verdict                    | Evidence                                                                                                                      |
| ---------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Unified exists therefore it is source of truth       | **Disproved**              | 0 TS callers; 0 rows; UI uses Channel/DM                                                                                      |
| Task.chatId is already the Task Conversation         | **Disproved**              | No Tasks API reads/writes; 0 non-null rows                                                                                    |
| Finance already uses Messaging Core                  | **Disproved**              | Product `groupChatId` → outbound worker; no Messenger message persist                                                         |
| No second WhatsApp destination exists                | **Disproved**              | Product groups vs `accountingGroupChatId`                                                                                     |
| Inbound webhook already lands in Messaging Core      | **Disproved**              | No WA webhook in NBOS module; Meta inbound persists in `MetaConversation`/`MetaMessage`, not Core                             |
| Client Sales is NEW / no second client message store | **Disproved**              | Live `MetaConversation`/`MetaMessage` writers; UI surface is `NEW`, history is `MIGRATE` (`M-CLIENT-01`, `M-CORE-01`)         |
| Empty Meta rows mean unused / NEW Sales history      | **Disproved**              | Same rule as Channel/DM and `TaskDiscussionEntry`; inbound ingest + CRM Lead UI                                               |
| Meta inherits Mail’s exemption from Messaging Core   | **Disproved**              | `M-MAIL-01` is EmailThread/EmailMessage only; no Canon decision extends it to Meta                                            |
| Channel/DM is unused                                 | **Disproved as code path** | Live service/UI writes; **this DB has 0 rows** so history migration is currently empty here                                   |
| seed cannot wipe Messenger                           | **Disproved**              | `seed.ts` / `seed-messenger.ts` `deleteMany` Channel/DM; seed does **not** delete Meta tables (Lead delete SetNulls `leadId`) |

---

## Legacy / bypass search classification

| Phrase / path                                      | Hits                                                                                                          | Class                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1 Product = 1 WhatsApp group                       | Cross-module search list; `01-WhatsApp-Integration.md` “одна группа на Product”; `05-Automation-Scenarios.md` | `UPDATE` (runtime still 1:1; Canon supersedes)              |
| Product WhatsApp Group as finance target           | Finance resolver + overdue/window senders                                                                     | `UPDATE` at Slice 10; current `KEEP` as runtime             |
| Support/Finance Conversation as chat type          | `01-WhatsApp-Integration.md` External→Support/Finance table; MessengerClient External placeholder copy        | `LEGACY/HISTORICAL` / `DELETE-LATER` UI copy                |
| public/internal Ticket discussion                  | Canon forbids; runtime has none                                                                               | `KEEP` (absent)                                             |
| Task Discussion belongs to task_discussion_entries | `05-Tasks/01-Task-System-Overview.md`; live code                                                              | `UPDATE` docs; runtime `MIGRATE` Slice 5                    |
| one Messenger Internal \| External switch          | `MessengerClient.tsx` buttons                                                                                 | `DELETE-LATER` Slice 7                                      |
| Telegram two-way project chat sync                 | Docs only; no TS                                                                                              | `KEEP` as forbidden; not implemented                        |
| canonical Product WhatsApp group (AI)              | `42-Phase-2-...`                                                                                              | `UPDATE` via binding resolver                               |
| MessengerTopic                                     | none in schema/code                                                                                           | `KEEP` gone                                                 |
| prisma.messengerConversation                       | schema only                                                                                                   | not active                                                  |
| groupChatId                                        | live Product/finance                                                                                          | `UPDATE` after Slice 9–10                                   |
| accountingGroupChatId                              | live official invoices                                                                                        | `KEEP` until Slice 10 classifies company vs Product FINANCE |
| TaskDiscussionEntry                                | live                                                                                                          | `MIGRATE`                                                   |
| Task.chatId                                        | unused column                                                                                                 | `DELETE-LATER`                                              |
| prisma.metaConversation / tx.metaConversation      | live ingest + merge/attach                                                                                    | `MIGRATE` (Slice 7) then `DELETE-LATER` (11)                |
| prisma.metaMessage / tx.metaMessage.create         | live inbound only                                                                                             | `MIGRATE` then `DELETE-LATER`                               |
| meta_conversations / meta_messages                 | schema + migration + live writers                                                                             | `MIGRATE` then `DELETE-LATER`; 0 rows ≠ unused              |
| Meta outbound / Graph send                         | absent                                                                                                        | `NEW` (Core persist when SEND exists)                       |
| WhatsAppWebAdapter in External placeholder         | `MessengerClient.tsx`                                                                                         | `DELETE-LATER` (stale copy; Gateway is actual transport)    |

---

## Remaining debt

- Slice 1 must choose Core without a third store; empty Unified + empty Channel/DM in **this** DB does not prove other environments.
- Slice 7 must map `MetaConversation`/`MetaMessage` into Core Client Sales; do not add a parallel Meta chat store. Empty Meta conversation rows here do not prove other environments.
- Confirm whether inventoried `DATABASE_URL` is staging or production before treating WhatsApp 143 groups as the production cutover set.
- Dedicated Task Activity Feed persistence vs derived UI vs audit log still `VERIFY-MISSING` as a product store (must stay separate from discussion).
- Official-invoice notification payloads that also store Product `groupChatId` vs accountant send destination need Slice 10 care.
- Cross-module docs still describe 1:1 Product groups and External Support/Finance chat categories.

## Known limitations

- Counts are from one reachable `DATABASE_URL`, not a proven production replica label.
- No message bodies, tokens, phones, or `encryptedApiToken` were copied. Meta `MetaProviderEvent.payload` was not copied.
- Gateway inbound contract was inventoried from NBOS absence + existing reconciliation/Gateway docs, not by running Gateway.
- Browser was not used; UI mount is proven from source.

## Rollback / compatibility strategy for later slices

Slice 0 changed no runtime. Later slices: additive first; Channel/DM, Task discussion, Meta conversation/message, and WhatsApp 1:1 remain rollback stores until their cutover slices are independently `VERIFIED`. Empty Channel/DM/Unified/discussion/Meta-conversation counts here mean a failed Slice 1–7 code cutover rolls back to current writers with no history loss **in this database**; WhatsApp bindings (145) are the high-value live dataset. `MetaProviderEvent` (17) must not be dropped with the empty conversation snapshot.

## Independent review

- reviewer: Master Architect chat (falsification / invariant-first), second pass after FINDING-01 fix
- inventoried SHA rechecked: `302f57f7e6b13f7a1acdc3c09e027549389fbabe`
- product TS/schema: no Slice 0 product-code changes (docs only)
- independent counts (pass 1): Channel/DM 0; Unified 0; Task 390 / chatId 0 / discussion 0; WA bindings 145 (ACTIVE 143 unique groups, FAILED 2); operations 9; participant sync 10; invitations 0; gateway 1 with accountant id present
- independent Meta recheck (pass 2): MetaConversation 0, MetaMessage 0, MetaConnectedAccount 0, MetaSenderIdentity 0, MetaProviderEvent 17
- independent code checks (pass 2): no `direction: 'OUTBOUND'` writes in `integrations/meta`; `MetaGraphClient` POST is `subscribed_apps` only; no Graph sendMessage

### Blocking findings

- FINDING-01 HIGH: **closed**. Client Sales UI `NEW` vs Meta history `MIGRATE` then `DELETE-LATER` (Slice 7 / 11) is consistent across evidence, reconciliation, checklist Slice 7 note, and cleanup register. Mail exemption is not applied to Meta. Empty Meta rows are not treated as unused.

### Non-blocking remaining debt

- Unlabeled `DATABASE_URL` (not proven prod vs staging).
- Meta inbound types are TEXT/EMPTY/UNSUPPORTED (no FileAsset media store); Slice 7 must not invent attachment fields.
- 17 `MetaProviderEvent` rows are idempotency/skipped webhooks, not conversation history.
- Docs for Slice 0 are uncommitted.

## Final status

VERIFIED
