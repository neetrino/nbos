# Slice 9 — Flexible Product Communication Bindings + legacy migration

Status: VERIFIED

Independent review complete. Claims in the implementer handoff were verified first-hand.

Based on HEAD `6fd7d04c` (Slice 8 VERIFIED). Slice 9 commit lands after this review. Slice 10 may begin. No DROP of `ProductWhatsAppGroupBinding`.

## Canonical decisions

- `M-WA-01` — purpose-based Product communication binding
- `M-WA-02` — one External Conversation may serve multiple Products
- `M-WA-03` — deterministic WORK/FINANCE destinations
- `M-WA-04` — Deal Won handles WORK without forcing Finance
- `M-WA-05` — automation resolves destination by Product + purpose
- `M-CLIENT-02` — Product client communication may live through the lifecycle
- `M-WHATSAPP-01` — existing WhatsApp Gateway remains the transport boundary
- `M-CORE-01` — database is source of truth
- `M-BOUNDARY-01` — binding does not grant conversation ACL

## Scope

Replace hard Product-owned WhatsApp group 1:1 with `ProductCommunicationBinding` (WORK | FINANCE) pointing at a canonical Client External Conversation + Slice 8 WHATSAPP mapping.

Out of scope: Slice 10 reminder scheduling/content, Support Ticket toggle, Slice 11 DROP, production migrate, dual-write Channel/DM, WAHA from NBOS, weakening Slice 7/8 controls.

## Existing runtime / migration notes

Legacy `ProductWhatsAppGroupBinding.groupChatId` uniqueness is kept DELETE-LATER. New destination writes go to Core mapping + `ProductCommunicationBinding`. Legacy row is dual-written only when unique `groupChatId` allows (first Product that owns that physical group). Shared Products skip the second legacy row so Deal Won / ops FKs stay valid.

Accountant `accountingGroupChatId` is never backfilled as WORK/FINANCE.

## Implementation requirements

See checklist Slice 9 in `11-Messenger-Rebuild-Implementation-Checklist.md`.

## Data migration / rollback

Risk: **LOW** (additive table + enum) with **MEDIUM** uniqueness awareness on legacy `groupChatId` (not dropped).

Migration: `packages/database/prisma/migrations/20260831210000_product_communication_bindings/migration.sql`

Adds:

- `ProductCommunicationPurpose` (`WORK` | `FINANCE`)
- `ProductCommunicationBindingStatus` (`ACTIVE`)
- `product_communication_bindings` unique `(product_id, purpose)`
- `WhatsAppGroupOperationTypeEnum.CREATE_FINANCE_GROUP`
- Idempotent WORK backfill: one Client EXTERNAL conversation + WHATSAPP mapping per distinct legacy `group_chat_id`; one WORK row per valid Product binding; no FINANCE rows; skip accountant group

Rollback: do not apply the migration. No destructive steps.

Backfill is rerunnable: `ON CONFLICT DO NOTHING` in SQL; TS `backfillProductWorkBindings` uses `replace: true` upserts.

## Tests / negative tests

Command (115 files passed, 1 skipped; 672 tests passed, 5 skipped):

```text
pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/integrations/whatsapp-gateway apps/api/src/modules/crm/deals apps/web/src/features/projects apps/api/src/modules/finance/invoices
```

New regression files:

- `product-whatsapp-ensure-heal.test.ts` (FINDING-S9-01, FINDING-S9-04 TS, FINDING-S9-07 leftover getState)
- `product-whatsapp-shared-sync-invite.test.ts` (FINDING-S9-02, FINDING-S9-04 overlay/invite, FINDING-S9-05, FINDING-S9-09 getState after detach, FINDING-S9-10 overlay)
- `product-communication-bind-acl.test.ts` (FINDING-S9-03)
- `product-communication-legacy-destination.test.ts` (FINDING-S9-04)
- `product-communication-legacy-write.ops.test.ts` (FINDING-S9-06)
- `product-communication-resolver.test.ts` (FINDING-S9-08 accountant mapping)
- `product-whatsapp-settings.test.ts` / `deal-won-whatsapp-gate.test.ts` (FINDING-S9-07 client, FINDING-S9-09 getState+view / sheet)
- `invoice-product-whatsapp-resolve.test.ts` (FINDING-S9-08 invoice)

- Product A WORK → Group 1; SEO shares the same conversation id (not cloned)
- Product A and SEO remain distinct Products
- Five Products FINANCE → one Finance Group F
- Product without FINANCE → WORK fallback
- Linking second Product does not add conversation participants (production-path: `persistBoundDestination` / access loader)
- Cannot create two active WORK destinations for one Product
- Accountant group skipped in backfill; accountant JID is not completed WORK
- Deal Won context prefers WORK communication destination
- Invoice destination uses FINANCE resolver with WORK fallback
- Slice 8 HMAC/outbox tests still pass
- Unique-legacy ACTIVE + normal JID heals to canonical WORK without a second Gateway create
- Unique-legacy ACTIVE + accountant JID does not no-op as success
- Shared Product B: sync/invite do not FK-fail and do not send a second invite; list/state show Group 1
- Unique-legacy ACTIVE accountant JID, no WORK: TS does not ADD; Deal Won/list overlay/invite/sync do not use accountant JID
- Product B unique-legacy GroupB then bind to A Group1: unique-legacy detached; invite/sync do not target GroupB
- Dual-write P2002: persistBoundDestination succeeds with no legacy id
- Unique-legacy ACTIVE leftover + empty WORK: getState `binding.groupChatId` is null; settings/Deal Won client use `state.work` only
- WORK mapping JID === accountant: resolver WORK and FINANCE fallback are null; invoice resolve does not return that JID
- After S9-05 detach: settings getState+`productWhatsAppBindingView` / sheet is ACTIVE + Group1, not FAILED + old unique-legacy name
- `communicationBindings` mapping JID === accountant: list overlay `groupChatId` is null (not accountant)

## Implementation result

- Resolver `resolveClientDestination(productId, WORK | FINANCE)` is the read path
- Product settings: WORK create/select; FINANCE use-WORK / create / select; project-scoped selector hint
- Deal Won create/bind stays WORK; Extension does not create a new group; Gateway failure still does not roll back Deal
- Invoice/card/overdue destination lookup uses the resolver; official accountant group unchanged
- Dual-write after WORK group create/bind; FINANCE create does not overwrite legacy WORK `groupChatId`

## Independent review findings (fixer)

MASTER-confirmed. This fixer does **not** declare VERIFIED.

### FINDING-S9-01 Medium — FIX

`ensureGroupForProduct` no longer treats unique-legacy ACTIVE + `groupChatId` as completed WORK when resolver WORK is missing.

- Non-accountant unique-legacy JID heals via `persistBoundDestination` (same chat id, no second Gateway create).
- Accountant unique-legacy JID is not healed and is not displayed as WORK overlay; ensure continues to enqueue create rather than no-op as success.

### FINDING-S9-02 Medium — FIX

`toBindingView` no longer forges `id: work.conversationId`. Shared Products without a unique-legacy row expose `binding.id: null` and overlay resolver WORK `groupChatId`.

- `POST sync` / `POST client-invite` no-op (200) when WORK exists without unique-legacy; they do not write a fake `bindingId` FK and do not send a duplicate invite.
- Project list overlays resolver WORK `groupChatId` from `communicationBindings`, not unique-legacy alone.

### FINDING-S9-03 Medium — FIX

Production-path negatives now run against `ProductWhatsAppGroupService` / `persistBoundDestination` / `loadMessengerCoreAccessFacts`:

1. Bind B to A’s group → `messengerConversationParticipant.create` not called
2. Access loader denies B’s developer (`canRead` false → Client GET 404 path)
3. Bind existing → no `SEND_CLIENT_INVITE`
4. Accountant JID → 409
5. Second WORK different chat without replace → 409

### FINDING-S9-04 High — FIX

Unique-legacy is a Product destination only when it matches resolver WORK and is not the accountant JID.

- `ensureTechnicalSpecialist` does not ADD to an accountant unique-legacy group; it heals/creates WORK via `ensureWorkGroupForProduct`.
- Deal Won `groupChatId` is resolver WORK only (accountant unique-legacy does not complete PRODUCT Won).
- Project list overlay does not show unique-legacy (including accountant) when WORK is missing.
- Invite/sync/worker transport use resolver WORK JID; they do not target the accountant JID.

### FINDING-S9-05 High — FIX

`dualWriteLegacyWorkBinding` detaches this Product’s unique-legacy (`groupChatId` null, status not ACTIVE) when another Product already owns the shared JID.

- Product B unique-legacy ACTIVE GroupB, then bind B to A’s Group1 → WORK is Group1; B unique-legacy is not ACTIVE on GroupB.
- Invite/sync take the shared no-op path; worker uses resolver WORK JID when unique-legacy disagrees.

### FINDING-S9-06 Medium — FIX

Dual-write catches unique `groupChatId` (`classifyDatabaseError` → `DB_UNIQUE_CONSTRAINT` / P2002) and returns `null` (same as `taken`). `persistBoundDestination` still succeeds with no legacy id.

### FINDING-S9-07 Medium — FIX

Unique-legacy is not presented as the current destination unless it matches resolver WORK.

- getState `binding.groupChatId` is resolver WORK only (`work?.groupChatId ?? null`); leftover unique-ACTIVE non-accountant JID is null until heal.
- Settings `productWhatsAppBindingView` / `selectedGroupId` prefer `state.work`.
- Deal Won client `resolveWonWhatsAppExistingGroupChatId` prefers `state.work` and does not treat leftover unique-legacy as existing WORK.
- Unique-ACTIVE leftover still heals via `ensureWorkGroupForProduct` / `maybeHealLegacyWorkDestination` (DB unique-legacy, not getState overlay).

### FINDING-S9-08 Medium — FIX

`resolveClientDestination` returns null when the mapped JID equals `accountingGroupChatId` (same rule as `resolveWorkTransportChatId`).

- WORK mapping JID === accountant → WORK is null; FINANCE fallback is null.
- Invoice `resolveInvoiceProductWhatsAppGroup` and Deal Won server context inherit the resolver null.
- Bind/backfill still 409/skip accountant; this covers admin later pointing `accountingGroupChatId` at an existing Product WORK JID.

### FINDING-S9-09 Medium — FIX

Product settings sheet drives WORK from `productWhatsAppBindingView` (WORK → ACTIVE). Leftover unique-legacy FAILED + stale `groupName` is not the destination.

- After S9-05 detach, getState+view / sheet reads ACTIVE + Group1, not FAILED + old unique-legacy name.
- When WORK exists, `groupName` is kept only if unique-legacy still matches that WORK JID.
- Detached unique-legacy remains FAILED in DB (invitation/sync FKs); UI destination is resolver WORK.

### FINDING-S9-10 Medium — FIX

`overlayProductWorkWhatsAppList` uses `resolveWorkTransportChatId` (same accountant rule as `resolveClientDestination`).

- Mapping JID === accountant is not presented as Product WORK (`groupChatId` null / not accountant).
- Unique-legacy-only accountant remains nulled (S9-04).

## Remaining debt

- Legacy table / unique `groupChatId` DELETE-LATER (Slice 11)
- Freeze remaining legacy writes after reviewer parity
- Slice 10: reminder scheduling/content, FINANCE access template, Support/attention routing
- Pre-existing worker file-size debt
- If `gatewayAccountId` is unset, backfill uses account id `default`; later account configuration may need mapping reconcile
- Worker `handleParticipants` / `handleInvite` remain over the function-length budget (pre-existing)
- Detached unique-legacy row is kept (`groupChatId` null, status not ACTIVE) because invitation/sync FKs cascade on delete

## Independent review (2026-08-31)

Verdict: **VERIFIED**. Independent reviewer (fresh Grok 4.6 Extra High). Slice 8 stays `VERIFIED`. Slice 10 may begin.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/integrations/whatsapp-gateway apps/api/src/modules/crm/deals apps/web/src/features/projects apps/api/src/modules/finance/invoices` — **672 passed**, 5 skipped (115 files passed, 1 skipped). Production migrate not run. Browser not live-clicked.

FINDING-S9-01…10 were re-checked first-hand and are closed for destination-of-record (resolver, send, Settings, Deal Won, list overlay). Unique-legacy remains DELETE-LATER residue, not the send target.

## Final status

VERIFIED
