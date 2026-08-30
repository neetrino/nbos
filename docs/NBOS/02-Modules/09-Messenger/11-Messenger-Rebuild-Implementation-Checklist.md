# Messenger Rebuild — Executable Implementation Checklist

> Status: **implementation contract**.
>
> Read first:
>
> 1. `00-Messenger-Overview.md`
> 2. `08-Messenger-Decision-Register.md`
> 3. `09-Messenger-Cross-Module-Canon.md`
> 4. `10-Messenger-Runtime-Reconciliation.md`
> 5. `12-Messenger-Rebuild-Execution-Strategy.md`
>
> This checklist does not redefine product architecture. Each slice implements approved decision ids and must be independently reviewed before dependent work continues.

## 1. Global completion rule

A checkbox is not complete because code exists.

A slice is complete only when all applicable items are true:

- implementation matches referenced canon decisions;
- migrations/backfills are safe and tested;
- positive behavior works;
- negative/security behavior works;
- existing production data is preserved;
- no forbidden legacy shortcut remains on the new path;
- automated tests pass;
- required manual/browser/integration checks pass;
- documentation is updated where runtime contracts changed;
- independent reviewer records evidence;
- slice status is `VERIFIED`.

Claims in implementation handoff are not review evidence.

---

## 2. Global migration gates

These apply to every slice touching persistence or existing runtime.

- [ ] Schema changes are additive before destructive.
- [ ] Backfills are idempotent, rerunnable, resumable or have an equally safe documented strategy.
- [ ] Existing records are counted/mapped before cutover.
- [ ] Production-like/staging migration is tested before production migration.
- [ ] Rollback/compatibility behavior is written before switching reads/writes.
- [ ] No destructive cleanup happens in the same step that first introduces a replacement model unless the reviewer proves there is no live/legacy data dependency.
- [ ] Legacy write path is disabled before legacy storage is deleted.
- [ ] Any `DELETE-LATER` item is tracked explicitly.
- [ ] No raw provider send bypasses Messaging Core authorization/outbox after its cutover slice.
- [ ] No Client SEND permission is inferred from READ, Product membership or collection membership.
- [ ] No cross-surface Collection item is possible through API/database manipulation.

---

# Slice 0 — Baseline, inventory and migration safety

**Goal:** establish a fresh runtime baseline before changing product code.

**Canon:** all decisions; especially `M-CORE-01`, `M-CLIENT-01`, `M-MAIL-01`, `M-TASK-01`, `M-WA-*`, `M-WHATSAPP-01`.

### Runtime inventory

- [x] Inspect actual Prisma/schema models for current Messenger channel/DM/unified remnants.
- [x] Inspect current Messenger REST/controllers/services.
- [x] Inspect Socket.IO/realtime handlers and unread/presence behavior.
- [x] Inspect Drive attachment integration.
- [x] Inspect current Messenger RBAC/access helpers.
- [x] Inspect Task Discussion schema/service/API/UI and real data shape.
- [x] Inspect Product ↔ WhatsApp group schema, unique constraints and provider identity fields.
- [x] Inspect Deal Won create/bind path and failure/outcome behavior.
- [x] Inspect Product Client Communication settings/current group actions.
- [x] Inspect Support public/internal communication runtime if present.
- [x] Inspect Finance/Subscription/Client Service reminder code; classify exact send path as `REUSE/EXTEND/MIGRATE/NEW/VERIFY-MISSING`.
- [x] Inspect NBOS integration with `neetrino/whatsapp-gateway` v1 + inbound webhook contract.
- [x] Inspect MetaConversation / MetaMessage / MetaConnectedAccount / MetaProviderEvent runtime (inbound persist, CRM Lead UI, merge/reassign, outbound absence); classify store vs Client Sales UI separately.
- [x] Inspect any relevant production/staging counts without exposing secrets/message content unnecessarily.

### Deliverables

- [x] Update `10-Messenger-Runtime-Reconciliation.md` with any materially different facts.
- [x] Produce runtime map: `REUSE / EXTEND / MIGRATE / NEW / DELETE-LATER / VERIFY-MISSING`.
- [x] Record exact legacy tables/fields/routes that later slices must retire.
- [x] Record migration ordering/dependencies.
- [x] No product behavior change in Slice 0 unless required only to add safe observability for migration.

### Acceptance

- [x] Reviewer can trace every planned destructive change to a prior migration/cutover slice.
- [x] No important existing store is classified from old documentation alone.
- [x] Slice status `VERIFIED`.

---

# Slice 1 — Messaging Core relational foundation

**Goal:** establish/confirm the canonical shared message engine without reintroducing old L1/L2 product architecture.

**Canon:** `M-CORE-01`, `M-FILES-01`, `M-MESSAGE-02`, `M-BOUNDARY-01`.

### Data model

- [x] Canonical `Conversation` supports strict zone/surface identity (`INTERNAL` or `CLIENT`).
- [x] Canonical `Message` supports sender/direction/status/provenance needed by internal and external messages.
- [x] Participants/membership/read state are normalized and permission-aware.
- [x] `ConversationLink` can link Project/Product/Work Space/Deal/Task/Ticket/Client without forcing one exclusive entity.
- [x] `MessageReference` can reference one/multiple canonical source messages from Task/Ticket/forward actions.
- [x] Reply/reaction/thread-root support is possible without making threads mandatory.
- [x] Attachments reference Drive File Assets.
- [x] Provider mapping/event/delivery concepts can be added without storing provider ids directly on Product.
- [x] Database constraints prevent impossible cross-zone relationships where feasible.

### Runtime

- [x] Commands persist DB state before realtime broadcast.
- [x] Realtime is transport only, not source of truth.
- [x] Duplicate command/idempotency behavior is defined where external/provider side effects may occur.
- [x] No L1/L2 Topic layer is required by canonical core.

### Migration

- [x] Existing compatible channel/DM data is mapped or explicitly scheduled for later mapping.
- [x] No existing message history is deleted.
- [x] Old unified remnants are reused only when contracts match canon.

### Tests

- [x] Conversation/message persistence.
- [x] zone validation.
- [x] participant/read-state behavior.
- [x] reference integrity.
- [x] attachment authorization/reference.
- [x] realtime replay does not create duplicate durable messages.

### Acceptance

- [x] Core can support both surfaces without mixing product UI.
- [x] Reviewer finds no hidden dependency on old Topic hierarchy.
- [x] Slice status `VERIFIED`.

---

# Slice 2 — Permission model and strict Internal/Client boundary

**Goal:** enforce security boundary before Client sending is introduced.

**Canon:** `M-BOUNDARY-01`, `M-BOUNDARY-02`, `M-SECURITY-01`, `M-SECURITY-02`, `M-ROUTING-01`.

### Permission contracts

- [ ] Reuse platform role/entity/manual-access foundations where compatible.
- [ ] Define Internal conversation read/write permission resolution.
- [ ] Define Client conversation `READ` separately from `SEND`.
- [ ] Explicit conversation invite/membership does not automatically imply SEND.
- [ ] Product binding does not grant conversation access.
- [ ] Shared Collection does not grant conversation access.
- [ ] Management override, where existing platform rules allow it, remains explicit/auditable.

### Surface boundary

- [ ] Internal routes/API cannot send through external provider path.
- [ ] Client send endpoint requires Client conversation + SEND permission.
- [ ] Server rejects attempts to send a Client message through Internal context.
- [ ] Internal and Client Collections are zone-scoped server-side.
- [ ] Client participant/access changes are audited.

### Negative tests

- [ ] READ without SEND cannot send.
- [ ] Product developer without Client access cannot read client history.
- [ ] Adding Product binding does not add developer access.
- [ ] Shared Collection item does not bypass conversation ACL.
- [ ] Internal conversation cannot acquire provider mapping/send capability by malformed request.
- [ ] Client conversation cannot be inserted into Internal Collection and vice versa.

### Acceptance

- [ ] Security boundary exists before Client composer implementation.
- [ ] Slice status `VERIFIED`.

---

# Slice 3 — Internal Messenger base: Groups, Direct, All, Collections

**Goal:** rebuild the daily Internal Messenger surface on canonical core.

**Canon:** `M-INTERNAL-01`, `M-INTERNAL-02`, `M-COLLECTIONS-01`, `M-BOUNDARY-02`.

### UI/navigation

- [ ] Separate Internal Messenger entry point/route.
- [ ] Navigation: `All / Products / Tasks / Deals / Work Spaces / Groups / Direct / Collections`.
- [ ] Slice implements at minimum working `All`, `Groups`, `Direct`, `Collections`; entity tabs may progressively activate in later slices.
- [ ] `All` is recent accessible activity, not Project tree.
- [ ] filters/search hooks for Unread/Mentions/current activity.

### Collections

- [ ] Built-in personal `Favorites` Collection.
- [ ] PERSONAL Collections.
- [ ] SHARED Collections.
- [ ] one conversation may belong to multiple Collections.
- [ ] Collection membership does not alter ACL.
- [ ] Internal Collections reject Client conversations.

### Migration

- [ ] Existing useful channel/DM history is reused/mapped without data loss.
- [ ] Old L1/L2 navigation does not return.

### Tests

- [ ] recent ordering/read state.
- [ ] Favorites/personal/shared semantics.
- [ ] ACL-filtered shared collections.
- [ ] internal-only surface boundary.

### Acceptance

- [ ] Team can use Groups/Direct/All on the new surface without relying on legacy mixed UI.
- [ ] Slice status `VERIFIED`.

---

# Slice 4 — Entity conversations: Product, Work Space, Deal, optional Project General

**Goal:** connect internal business entities to canonical conversations.

**Canon:** `M-PROJECT-01`, `M-WORK-01`, `M-WORK-02`.

### Product / Connected Work Space

- [ ] Product `Chat` resolves to canonical work Conversation.
- [ ] Connected Work Space `Discussion` resolves to the same conversation id.
- [ ] race-safe ensure/lookup prevents duplicate conversations.
- [ ] Product and Work Space are both represented through ConversationLink/equivalent context.

### Standalone Work Space

- [ ] Standalone Work Space can have its own conversation.
- [ ] It does not require fake Product ownership.

### Deal

- [ ] Internal Deal discussion is an Internal conversation.
- [ ] It is never the same object as Client Sales conversation.

### Project

- [ ] Project communication view acts as contextual aggregator.
- [ ] Project General is optional/lazy, not auto-created for every Project.

### Migration

- [ ] Detect Product/Workspace duplicate legacy chats before relinking.
- [ ] Preserve both histories if both contain real data; no silent overwrite.
- [ ] Ambiguous duplicate history is manually mapped or merged with provenance.

### Acceptance

- [ ] Product and its Connected Work Space demonstrably open the same conversation.
- [ ] No eager empty Project General creation.
- [ ] Slice status `VERIFIED`.

---

# Slice 5 — Task Discussion migration and Task Card wiring

**Goal:** replace the separate human Task comments/discussion store with Messaging Core safely.

**Canon:** `M-TASK-01`, `M-TASK-02`, `M-FILES-01`.

### Migration/backfill

- [ ] Implement the exact safe sequence in `10-Messenger-Runtime-Reconciliation.md`.
- [ ] Map only Tasks with legacy discussion to existing/backfilled conversations; new empty Tasks stay lazy.
- [ ] Preserve author/actor identity.
- [ ] Preserve timestamps/order.
- [ ] Preserve edited state where available.
- [ ] Preserve attachments/File Assets.
- [ ] Preserve AI/system provenance where relevant.
- [ ] Preserve audit/activity associations/source provenance.
- [ ] Idempotent source mapping prevents duplicate migrated messages.
- [ ] Per-Task count/order/attachment verification report exists.

### Runtime cutover

- [ ] New Task human messages write only to Messaging Core after cutover.
- [ ] Task Card reads human Discussion from Messaging Core.
- [ ] System Activity Feed remains Task-owned system activity.
- [ ] Task closure/archive behavior does not delete discussion.

### Negative tests

- [ ] rerunning backfill creates no duplicates.
- [ ] legacy attachment cannot disappear.
- [ ] inaccessible Task discussion cannot be opened through Messenger direct id.
- [ ] Activity event is not accidentally transformed into human message.

### Cleanup gate

- [ ] legacy Task Discussion write path marked disabled.
- [ ] legacy table/storage remains `DELETE-LATER` until final acceptance.

### Acceptance

- [ ] reviewer samples migrated Tasks with text + attachments + varied authors/provenance.
- [ ] Slice status `VERIFIED`.

---

# Slice 6 — Message references, forwarding and Create Task actions

**Goal:** turn messages into reusable work context without duplicating source truth.

**Canon:** `M-MESSAGE-01`, `M-MESSAGE-02`, `M-MESSAGE-03`.

### Message actions

- [ ] one-message selection.
- [ ] multi-message selection.
- [ ] Reply.
- [ ] Share/Forward reference into permitted Internal conversation.
- [ ] Create Task from selected Internal or Client messages.
- [ ] Open/copy source context.
- [ ] Client-only action hooks for Ticket/Deal/Invite prepared or implemented where dependency permits.

### Create Task

- [ ] opens full Task creation workflow; does not blindly convert message body into final Task.
- [ ] selected messages/attachments become source references/context.
- [ ] title/description/assignee/links remain explicit Task fields.
- [ ] supports primary context + additional entity links where Task domain allows.

### Threads

- [ ] reply/thread support does not force forwarding into a new thread.
- [ ] `Discuss internally`/Share does not create a new Conversation automatically.

### Tests

- [ ] source message remains canonical after Task/Ticket/reference creation.
- [ ] deleting/removing a reference does not delete source message.
- [ ] permission to source preview/open is checked.
- [ ] multiple selected messages retain deterministic order.

### Acceptance

- [ ] no duplicate independent message store is introduced.
- [ ] Slice status `VERIFIED`.

---

# Slice 7 — Client Messenger surface and locked composer

**Goal:** build the separate external communication product surface before full provider cutover.

**Canon:** `M-BOUNDARY-01`, `M-CLIENT-01`, `M-CLIENT-02`, `M-SECURITY-01`, `M-SECURITY-02`, `M-COLLECTIONS-01`, `M-AI-01`.

**Slice 0 note:** `MetaConversation` / `MetaMessage` is the live Client Sales inbound store (`MIGRATE` into Core). This slice owns that cutover identity. Do not classify Sales **history** as `NEW`. Do not wait for Slice 8 (WhatsApp-only) to map Meta. Do not apply `M-MAIL-01` to Meta. Meta outbound send is `NEW` and must persist in Core, not a fourth store.

### Navigation/UI

- [ ] separate Client Messenger entry point/route.
- [ ] navigation: `Inbox / Sales / Clients / Collections`.
- [ ] visibly different external identity/accent/icons from Internal surface.
- [ ] Inbox supports attention-oriented views such as Unread/Needs response/assigned team/provider.
- [ ] Client Collections are separate and cannot contain Internal chats.

### Locked composer

- [ ] opening/switching to a Client conversation starts composer locked.
- [ ] authorized user explicitly clicks `Reply to client`.
- [ ] unlocked composer clearly displays `CLIENT VISIBLE` + provider/client/context.
- [ ] switching conversation relocks.
- [ ] server SEND check remains mandatory.
- [ ] no Internal/Public toggle.

### External-specific tools

- [ ] Create Task.
- [ ] Share/Forward internally.
- [ ] Ticket/Deal actions where dependency is ready.
- [ ] invite/read-only specialist flow.
- [ ] placeholder/interface for future AI operator/draft policy without granting implicit SEND.

### Negative/adversarial tests

- [ ] keyboard/route state cannot leave composer unlocked for another conversation.
- [ ] Internal message draft cannot be silently carried into Client composer as send-ready text.
- [ ] READ-only user cannot unlock/send.
- [ ] forged UI state does not bypass server SEND permission.

### Acceptance

- [ ] Internal and Client surfaces feel and behave as separate work modes.
- [ ] Slice status `VERIFIED`.

---

# Slice 8 — WhatsApp connector, Gateway inbound/outbound and delivery state

**Goal:** connect Client Messaging Core to the existing transport service without duplicating Gateway functionality.

**Canon:** `M-WHATSAPP-01`, `M-CORE-01`.

### Gateway reuse

- [ ] use existing `neetrino/whatsapp-gateway` project/account/session boundary.
- [ ] prefer account-scoped v1 send with idempotency where appropriate.
- [ ] consume normalized authenticated Project webhooks for MESSENGER account inbound events.
- [ ] do not expose WAHA directly to NBOS/web clients.
- [ ] do not move Product/permissions/routing logic into Gateway.

### Outbound

- [ ] Client message is persisted before provider dispatch.
- [ ] durable outbox/queue job dispatches to Gateway.
- [ ] stable idempotency key links NBOS send attempt to Gateway attempt.
- [ ] delivery states handle queued/sending/sent/delivered/read/failed/outcome-unknown as supported.
- [ ] retries never double-send an outcome-unknown message blindly.

### Inbound

- [ ] verify Gateway HMAC/timestamp/replay protection.
- [ ] dedupe by stable provider/Gateway event/message ids.
- [ ] resolve account + external chat to canonical Client Conversation mapping.
- [ ] persist before realtime broadcast.
- [ ] ack/edit/revoke/reaction/session status handled according to supported contract.

### Tests

- [ ] inbound duplicate webhook idempotency.
- [ ] outbound retry/idempotency.
- [ ] disconnected session failure.
- [ ] unknown external conversation behavior is explicit, not silently misbound.
- [ ] provider event cannot cross Project/account boundary.

### Acceptance

- [ ] end-to-end inbound/outbound works through Gateway without direct WAHA dependency in NBOS.
- [ ] Slice status `VERIFIED`.

---

# Slice 9 — Flexible Product Communication Bindings + legacy migration

**Goal:** replace hard Product-owned WhatsApp group relation with deterministic flexible WORK/FINANCE bindings.

**Canon:** `M-WA-01` through `M-WA-05`, `M-CLIENT-02`, `M-WHATSAPP-01`.

### Additive data model

- [ ] ProductCommunicationBinding/equivalent stores Product + purpose + canonical External Conversation.
- [ ] one active WORK per Product.
- [ ] zero/one explicit FINANCE per Product.
- [ ] same External Conversation can be reused by many Products.
- [ ] binding is separate from participant/access records.

### Legacy migration

- [ ] execute full sequence in `10-Messenger-Runtime-Reconciliation.md`.
- [ ] every existing group provider id maps to one External Conversation/provider mapping.
- [ ] every existing Product group binding backfills as WORK.
- [ ] no automatic FINANCE rows are created.
- [ ] current Products resolve to their same old physical group after backfill.
- [ ] current group history/status/settings/provenance are preserved where available.

### Product settings

- [ ] WORK: Create new / Select existing.
- [ ] FINANCE: Use WORK(default) / Create new / Select existing.
- [ ] existing-group selector is scoped to safe client/Project context by default.
- [ ] selecting an existing conversation does not send duplicate client invite.

### Deal Won

- [ ] Product/Outsource Deal Won resolves WORK.
- [ ] preserves current create/bind/error/outcome behavior.
- [ ] Gateway failure does not incorrectly roll back Product/Deal state.
- [ ] Extension uses existing Product communication by default.
- [ ] FINANCE is not required to finish normal Deal Won.

### Resolver

- [ ] `resolveClientDestination(productId, WORK)` deterministic.
- [ ] `resolveClientDestination(productId, FINANCE)` explicit FINANCE else WORK.
- [ ] no new business send depends on Product raw group id.

### Scenario tests

- [ ] Product A WORK → Group 1.
- [ ] SEO Product WORK → same Group 1.
- [ ] Product A and SEO remain distinct Products/entities.
- [ ] five Products FINANCE → one Finance Group F.
- [ ] Product without FINANCE → WORK fallback.
- [ ] linking second Product does not grant its developers access.
- [ ] cannot create two active WORK destinations for one Product.

### Cleanup gate

- [ ] legacy one-to-one constraints/fields are `DELETE-LATER`, not dropped until parity/cutover verified.

### Acceptance

- [ ] shared groups are real reused conversations, not cloned rows/provider groups.
- [ ] Slice status `VERIFIED`.

---

# Slice 10 — Finance, Support and attention routing integration

**Goal:** connect business workflows to canonical client conversations without creating duplicate message universes.

**Canon:** `M-WA-05`, `M-ROUTING-01`, `M-SUPPORT-01`, `M-CLIENT-01`.

### Finance automation

- [ ] all automatic payment/money reminders use purpose `FINANCE`.
- [ ] includes approved invoices/subscriptions/hosting/domain/maintenance/client-service reminders.
- [ ] Finance owns timing/business rule; Messaging Core owns destination/send/history.
- [ ] explicit FINANCE binding receives reminder.
- [ ] no explicit FINANCE binding falls back to WORK.
- [ ] manual employee Finance chat is ordinary Client Messenger behavior, separate from scheduler/reminder generation.
- [ ] client reply remains in the physical conversation that received the reminder.
- [ ] no separate Finance Messenger is introduced.

### FINANCE default access template

- [ ] Owner.
- [ ] CEO.
- [ ] Finance Director.
- [ ] relevant Seller.
- [ ] relevant Product PM.
- [ ] developers/other Product members are not automatically added.
- [ ] READ/SEND still resolved by permissions.

### Support

- [ ] Ticket remains internal case/SLA entity.
- [ ] Client external messages are referenced, not copied into public Ticket chat.
- [ ] Ticket has no final Public/Internal composer toggle.
- [ ] Create/link Ticket action available from Client message where authorized.
- [ ] execution can create/link Task(s).
- [ ] client reply/update returns through Client Messenger.

### Attention routing

- [ ] Delivery WORK default → Product PM.
- [ ] Maintenance WORK default → Support Intake queue.
- [ ] FINANCE → Finance/authorized queue.
- [ ] routing does not change canonical conversation id.
- [ ] manual reassignment supported.
- [ ] no permanent hard-coded employee owner.

### Tests

- [ ] reminder routing with and without explicit FINANCE.
- [ ] one shared FINANCE group serving multiple Products.
- [ ] manual finance participant with READ but no SEND.
- [ ] lifecycle Delivery → Maintenance changes attention, not conversation.
- [ ] Ticket source references obey Client access.

### Acceptance

- [ ] Support/Finance behavior operates around Client Messenger, not parallel chat stores.
- [ ] Slice status `VERIFIED`.

---

# Slice 11 — Search, realtime, notifications, cleanup readiness and release hardening

**Goal:** close cross-cutting behavior and prove the system is ready for independent final acceptance.

**Canon:** all decisions.

### Search / activity

- [ ] Internal search filters only accessible Internal conversations.
- [ ] Client search filters only accessible Client conversations.
- [ ] shared physical client conversation can expose linked Product context without duplicating message history.
- [ ] archived/closed Task conversations remain discoverable from Task/history where permitted.

### Realtime/read state

- [ ] unread/read state consistent across entity surfaces that point to same conversation.
- [ ] Product and Connected Work Space do not double-count same unread conversation.
- [ ] provider inbound updates correct Client Inbox/attention state.

### Notifications

- [ ] Notifications consumes message/activity events without becoming chat history source.
- [ ] client/internals use correct deep links/surface.
- [ ] no notification deep link opens Client message in Internal composer.
- [ ] Telegram notification behavior stays separate from historical chat migration.

### Cleanup scan

- [ ] no active L1/L2 Topics dependency.
- [ ] no new legacy Task Discussion writes.
- [ ] no raw Product `groupChatId` business sends after cutover.
- [ ] no one-to-one external-conversation uniqueness blocking shared bindings.
- [ ] no public Support Ticket send mode.
- [ ] no mixed Internal/Client collection/list path.
- [ ] no permanent Telegram chat bridge.
- [ ] stale docs/status references updated.

### Destructive cleanup preparation

- [ ] every legacy field/table marked for deletion has migration evidence.
- [ ] backups/rollback plan recorded.
- [ ] final acceptance can be executed before irreversible removal if safer.
- [ ] cleanup is split into a dedicated verified change when risk warrants it.

### Acceptance

- [ ] all Slices 0–10 are `VERIFIED`.
- [ ] all known migration debt is explicit.
- [ ] system is ready for `90-Messenger-Final-Acceptance.md`.
- [ ] Slice status `VERIFIED`.

---

## 3. Implementation slice status table

| Slice                            | Status     | Implementer evidence            | Independent review                 |
| -------------------------------- | ---------- | ------------------------------- | ---------------------------------- |
| 0 — Baseline/reconciliation      | `VERIFIED` | `20-Slice-00-Baseline.md`       | VERIFIED (FINDING-01 closed)       |
| 1 — Messaging Core               | `VERIFIED` | `21-Slice-01-Messaging-Core.md` | VERIFIED (FINDING-S1-01/02 closed) |
| 2 — Permissions/boundary         | `PLANNED`  | —                               | —                                  |
| 3 — Internal base                | `PLANNED`  | —                               | —                                  |
| 4 — Entity conversations         | `PLANNED`  | —                               | —                                  |
| 5 — Task Discussion migration    | `PLANNED`  | —                               | —                                  |
| 6 — Message actions/references   | `PLANNED`  | —                               | —                                  |
| 7 — Client surface               | `PLANNED`  | —                               | —                                  |
| 8 — WhatsApp Gateway integration | `PLANNED`  | —                               | —                                  |
| 9 — Flexible Product bindings    | `PLANNED`  | —                               | —                                  |
| 10 — Finance/Support/routing     | `PLANNED`  | —                               | —                                  |
| 11 — Hardening/cleanup readiness | `PLANNED`  | —                               | —                                  |

Status changes must follow `12-Messenger-Rebuild-Execution-Strategy.md`.
