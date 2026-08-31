# Slice 8 — WhatsApp connector, Gateway inbound/outbound and delivery state

Status: VERIFIED

Independent review complete. Claims in the implementer handoff were verified first-hand.

Based on HEAD `f78997ee` (Slice 7 VERIFIED). Slice 8 commit lands after this review.

## Canonical decisions

- `M-WHATSAPP-01` — existing WhatsApp Gateway remains the transport boundary
- `M-CORE-01` — database is source of truth; persist before realtime; durable outbox for external send
- `M-BOUNDARY-01` — Internal cannot acquire provider send/mapping; Client inbound cannot land on INTERNAL
- `M-SECURITY-01` / `M-SECURITY-02` — locked composer and READ ≠ SEND stay as Slice 7; this slice does not weaken them
- `M-CLIENT-01` — Client Messenger remains Inbox / Sales / Clients / Collections; WhatsApp threads appear there via Core mapping

Out of scope: `M-WA-01`…`M-WA-05` Product WORK/FINANCE bindings (Slice 9).

## Scope

Connect Client Messaging Core to the existing `neetrino/whatsapp-gateway` transport:

```text
Inbound:  WhatsApp -> WAHA -> Gateway -> authenticated NBOS webhook -> Messaging Core
Outbound: Messaging Core persist (canSend) -> durable outbox/queue -> Gateway v1 -> WAHA
```

Working in this slice:

- Consume Gateway Project webhooks (`message.received` / `ack` / `edited` / `revoked` / `reaction` / `session.status`)
- HMAC-SHA512 + timestamp replay window; dedupe by Gateway `eventId`
- Resolve `(WHATSAPP, accountId, chatId)` to a Client EXTERNAL conversation; unknown chats get a new Client conversation, never a Product bind
- Client SEND on a WhatsApp-mapped conversation persists first (`QUEUED`), then durable outbox + account-scoped v1 send with stable `Idempotency-Key`
- Delivery states: queued / sending / sent / delivered / read / failed / outcome_unknown
- `OUTCOME_UNKNOWN` and disconnected session do not blindly double-send

Out of scope: Slice 9 ProductCommunicationBinding, Slice 10 Finance/Support routing, DROP ProductWhatsAppGroupBinding / Meta / Channel / DM, production migrate, dual-write Channel/DM, building a second gateway, exposing WAHA, commit / push.

## Invariants (this slice)

- NBOS never calls WAHA. Web clients never see Gateway tokens or WAHA keys.
- Product ownership, ACL, and WORK/FINANCE routing stay in NBOS. Gateway stays transport/session.
- persistAndBroadcast arity stays 1. Client persist still requires `canSend`.
- Provider events cannot attach to an INTERNAL conversation or to a different Gateway account’s mapping.
- Unknown inbound chat is explicit: new CLIENT EXTERNAL + mapping keyed by account+chat. Not silently bound to a Product group row.
- Finance/Product-group outbound workers stay on their current path until Slices 9–10.

## Implementation requirements

See checklist Slice 8 in `11-Messenger-Rebuild-Implementation-Checklist.md`.

## Data migration / rollback

Additive only. No DROP. No Product binding rewrite. Production migrate **not run**.

Migration: `packages/database/prisma/migrations/20260831200000_messenger_whatsapp_gateway_connector/migration.sql`

Adds:

- `MessengerCommandStatus.OUTCOME_UNKNOWN`
- `MessengerProviderEvent` unique `(provider, eventId)`
- `MessengerMessageExternalRef` unique `(provider, externalAccountId, externalMessageId)`
- `WhatsAppGatewayConnection.encryptedWebhookSecret` / `gatewayAccountId`

Rollback: do not apply the migration. No destructive steps.

## Tests / negative tests

- HMAC sha512 accept / bad signature / replay window (`whatsapp-gateway-webhook.hmac.test.ts`)
- Unknown chat creates CLIENT EXTERNAL with `wa:{accountId}:{chatId}`; does not read Product bindings
- Inbound message idempotency replay (same provider message id)
- Account A mapping is not used for account B + same `chatId`
- INTERNAL mapped chat is skipped (`INTERNAL_ZONE_FORBIDDEN`); mapping upsert is not attempted
- `fromMe` echo and `@lid` / `@s.whatsapp.net` JIDs skipped
- Duplicate Gateway `eventId` already `PROCESSED` is not re-dispatched
- Client persist on a WhatsApp mapping: persist `QUEUED` → enqueue `core_client_send` with `wait: false` → emit (arity 1, `canSend` still required)
- Persist HTTP returns the queued message when enqueue/`waitUntilFinished` rejects; outbox stays PENDING
- Client composer `idempotencyKey` is sent and reused until HTTP success
- Core leftover persist HTTP (`POST messenger/core/conversations/:id/messages`) 404s CLIENT and does not enqueue Gateway
- HMAC sha512 over captured Express raw bytes on the WhatsApp webhook path; missing `rawBody` rejected; Meta path still captures
- Concurrent SENT vs READ ack cannot persist SENT after READ
- Worker `completeCoreSend` SENT cannot overwrite a concurrent ACK READ; SENDING/FAILED/OUTCOME_UNKNOWN cannot clobber DELIVERED/READ
- `completeCoreSend` writes the external ref before SENT; SENT CAS count 0 still upserts the ref
- Inbound idempotency replay upserts a missing external ref
- ACK before ref does not SKIP the provider event; later `eventId` while RECEIVED applies
- Later ACK repairs `OUTCOME_UNKNOWN` → DELIVERED/READ (not a Gateway resend)
- Queue unavailable after persist leaves PENDING; worker drain enqueues; unclassified exhausted throw marks FAILED (not SENDING)
- `OUTCOME_UNKNOWN` with a WHATSAPP ref does not call Gateway again
- SENT/DELIVERED/READ/`OUTCOME_UNKNOWN` without a WHATSAPP ref recovers `messageId` with the same `Idempotency-Key` (no second Core message)
- Gateway success without `messageId` does not write SENT; throws retryable `HTTP_503`
- BullMQ-exhausted HTTP 5xx (`HTTP_502`/`HTTP_503`/`HTTP_504`) marks `OUTCOME_UNKNOWN`, not FAILED
- Disconnected session (`WHATSAPP_NOT_CONNECTED`) marks `FAILED` without throw
- `MESSAGE_OUTCOME_UNKNOWN` marks `OUTCOME_UNKNOWN` without throw (BullMQ must not resend)
- `WAHA_UNAVAILABLE` / `GATEWAY_UNAVAILABLE` throw so BullMQ retries the same key; exhaustion marks `OUTCOME_UNKNOWN`, not FAILED
- Drain of `OUTCOME_UNKNOWN` + no WHATSAPP ref + `completedAt` older than `WHATSAPP_CORE_UNKNOWN_RECONCILE_MS` re-enqueues the same `idempotencyKey`
- `core_client_send` replaces a completed/failed BullMQ job; finance/official completed jobs still no-op
- Account-scoped `POST /api/v1/accounts/:accountId/messages` with `Idempotency-Key`
- Client UI delivery labels; realtime merge replaces by message id

## Implementation result

### Inbound

- Public `POST /api/integrations/whatsapp-gateway/webhook` on `MessengerModule` (avoids Nest cycle; `WhatsAppGatewayModule` does not import Messenger).
- Express JSON parser `verify` captures `rawBody` for `/api/integrations/whatsapp-gateway/webhook` and `/api/integrations/meta/webhook`. HMAC is over those exact bytes (`${timestamp}.${rawBody}`), never `JSON.stringify(parsedBody)`. Missing `rawBody` → `WEBHOOK_INVALID_SIGNATURE`.
- Headers: `X-Gateway-Event-Id`, `X-Gateway-Timestamp` (unix ms), `X-Gateway-Signature` HMAC-SHA512 hex, `X-Gateway-Signature-Algorithm` = `sha512`. Replay ±5 minutes. Signing secret from encrypted connection row or `WHATSAPP_GATEWAY_WEBHOOK_SECRET`. Missing secret → 503.
- Claim `MessengerProviderEvent` first. Duplicate `eventId` with `PROCESSED`/`SKIPPED` is a no-op; incomplete `RECEIVED` may re-dispatch. Message-level idempotency is `core-wa-in:{accountId}:{providerMessageId}`.
- Unknown chat → new CLIENT EXTERNAL + mapping `(WHATSAPP, accountId, chatId)`. Canonical key `wa:{accountId}:{chatId}`. Does not read `ProductWhatsAppGroupBinding`.
- `fromMe` inbound skipped (echo). Invalid JID skipped. INTERNAL zone skipped. Reactions skipped (`PROVIDER_REACTION_NO_EMPLOYEE`). `session.status` recorded, no message. Ack 1/2/3 → SENT/DELIVERED/READ with a monotonic `updateMany` (no concurrent downgrade). ACK may repair `OUTCOME_UNKNOWN` → SENT/DELIVERED/READ; FAILED and CANCELLED stay terminal.
- Inbound idempotency replay upserts a missing `MessengerMessageExternalRef`.
- `MESSAGE_NOT_FOUND` on ack/edit/revoke leaves the provider event `RECEIVED` and fails the webhook with 503 so Gateway retries. Terminal skips stay SKIPPED + 200.

### Outbound

- Client `persistAndBroadcast` (arity 1) still requires `canSend`. WhatsApp-mapped CLIENT persist uses `QUEUED`, then outbox upsert + BullMQ `wait: false` (persist HTTP does not wait for Gateway). Enqueue reject after outbox is logged and leaves PENDING for drain; HTTP still returns the persisted message. Leftover Core HTTP persist 404s CLIENT (Internal persist still 404s CLIENT). Client send stays on `/messenger/core/client/...` and sends a stable per-attempt `idempotencyKey`.
- Queue kind `core_client_send` on existing `whatsapp.outbound-messages`. Finance kinds (`official_send`, reminders, `client_invite`) unchanged.
- If the queue is unavailable after outbox write, the command stays `PENDING`. The outbound worker drains PENDING `core-wa-send:*` on `onModuleInit` and at the start of `process`. Persist-HTTP enqueue reject after outbox is logged and does not fail the persist response.
- Account-scoped v1 send: `POST /api/v1/accounts/:accountId/messages` `{ type: "TEXT", chatId, text }` with `Idempotency-Key` `core-wa-send:{messageId}`.
- `OUTCOME_UNKNOWN` / SENT / DELIVERED / READ / CANCELLED with a WHATSAPP ref → no Gateway call. The same statuses without a WHATSAPP ref call Gateway again with the same `Idempotency-Key` only to recover `messageId` (no second Core message; no CAS-downgrade of DELIVERED/READ). Disconnected / not configured → `FAILED`, no throw. `MESSAGE_OUTCOME_UNKNOWN` → `OUTCOME_UNKNOWN`, no throw (proven-unknown accept; BullMQ must not blindly resend). `WAHA_UNAVAILABLE` / `GATEWAY_UNAVAILABLE` throw like HTTP 5xx so BullMQ retries the same key; on exhaustion those codes mark `OUTCOME_UNKNOWN`, not FAILED. Unclassified application errors still exhaust to `FAILED`. Gateway success without `messageId` is retryable `HTTP_503`, not SENT. After exhaustion, drain re-enqueues `OUTCOME_UNKNOWN` commands with no WHATSAPP ref once `completedAt` is older than `WHATSAPP_CORE_UNKNOWN_RECONCILE_MS` (60s); `core_client_send` removes a completed/failed BullMQ job then adds with the same `Idempotency-Key`. Finance completed jobs still no-op. Drain bumps `completedAt` on each reconcile enqueue so the 2s worker gap cannot tight-loop.
- If `completeCoreSend` loses the SENT CAS, it still upserts the provider external ref when `providerMessageId` is present. The ref is written **before** the SENT CAS so ACK/edit/revoke can resolve the row.

### UI

- Client thread shows outbound delivery labels (Queued / Sending / Sent / Delivered / Read / Failed / Delivery unknown).
- Client composer sends a stable per-attempt `idempotencyKey` and reuses it until HTTP success.
- Client and Internal apps merge realtime Core messages by id so ack updates replace the row.
- Integrations card stores webhook signing secret (encrypted). Public view exposes `hasWebhookSecret`, never the secret.

### Module boundary

- NBOS does not call WAHA. Web clients do not receive Gateway tokens.
- Product WORK/FINANCE bindings remain Slice 9.

## Independent review (2026-08-31)

Verdict: **VERIFIED**. Independent reviewer (fresh Grok 4.6 Extra High). Slice 7 stays `VERIFIED`. Slice 9 may begin.

Independently re-run: `pnpm test -- apps/api/src/modules/messenger apps/api/src/modules/integrations/whatsapp-gateway apps/api/src/http/json-webhook-raw-body.test.ts apps/web/src/features/messenger-client apps/web/src/features/messenger/merge-core-realtime-message.test.ts apps/web/src/lib/api/messenger-core.test.ts` — **330 passed**, 5 skipped (58 files passed, 1 skipped). Browser was **not** live-clicked. Production migrate not run. Live Gateway/WAHA E2E not run.

FINDING-S8-01…10 were re-checked first-hand in this tree and are closed (HMAC rawBody, Internal CLIENT 404, ACK/outbound CAS, persist `wait: false`, client idempotencyKey, ACK-before-ref 503 not SKIPPED, no SENT without `messageId`, 5xx/WAHA exhaust to `OUTCOME_UNKNOWN`, missing-ref same-key drain).

### Remaining (not blocking)

- Worker does not emit SENT/FAILED/OUTCOME_UNKNOWN; live UI can sit on QUEUED until ACK or reload.
- `gatewayAccountId` is stored but unused on webhook ingest.
- Gateway Idempotency-Key TTL (docs: 24h) vs unbounded UNKNOWN drain is a later ops bound, not a Slice 8 contract hole.
- Client HTTP `idempotencyKey` is optional; the web composer supplies it.
- `fromMe` phone-originated messages never enter Core.
- `mergeCoreRealtimeMessage` is last-write-wins (worker does not emit status today).

## Remaining debt

- Live Gateway/WAHA end-to-end against a paired session was not run in this environment.
- Production migrate not run.
- Drain is best-effort (`onModuleInit` + each worker `process`). If Redis never returns, PENDING remains until a worker with a live queue starts.
- Media inbound is text/`hasMedia` only; Drive/Gateway binary transfer is not this slice.
- If v1 send never returns `messageId` after retries, the row is `OUTCOME_UNKNOWN` without a ref. Drain re-enqueues the same `Idempotency-Key` after `WHATSAPP_CORE_UNKNOWN_RECONCILE_MS` until a ref exists; ACK/edit/revoke stay 503 until that recovery writes the ref.
- `fromMe` inbound echoes are skipped; outbound provider id comes from the v1 send result.
- Worker process does not emit Socket.IO (dedicated worker has no clients). Persist HTTP emits QUEUED immediately and does not wait on the job. Later `message.ack` webhooks emit DELIVERED/READ on the API process.
- FK `ADD CONSTRAINT` in the migration is wrapped in `duplicate_object` handlers; first apply still requires the referenced tables to exist.
- Slice 9 ProductCommunicationBinding / Slice 10 Finance destination resolver are not started.

## Final status

VERIFIED
