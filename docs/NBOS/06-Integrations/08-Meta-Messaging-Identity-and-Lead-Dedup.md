# Meta Messaging Identity and Lead Deduplication

Meta inbound Instagram and Facebook DMs are persisted as sender identity, conversation, and message rows. One connected Meta account + one scoped sender maps to one conversation and one CRM Lead.

## Identity key

```
platform + metaConnectedAccountId + senderScopedId
```

Never use username, display name, or profile URL for identity resolution. Instagram IGSID and Facebook PSID are never merged across platforms.

## Data model

- `MetaSenderIdentity` — cached sender profile (`displayName`, `username`, `profileFetchedAt`, …)
- `MetaConversation` — one per sender per connected account; optional `leadId` (unique)
- `MetaMessage` — inbound message history; unique on `platform + metaConnectedAccountId + providerMessageId`

Message uniqueness includes `metaConnectedAccountId` because provider message IDs are scoped to the receiving business asset connection.

## Ingest flow

1. Resolve `MetaConnectedAccount` and require linked SMM `MarketingAccount`
2. Idempotent `MetaProviderEvent` on `provider + eventId` (webhook retry protection)
3. Resolve or refresh sender profile (24h cache)
4. Serializable transaction:
   - upsert sender identity
   - upsert conversation
   - create Lead only when `conversation.leadId` is null
   - insert message (skip duplicate `providerMessageId`)
   - update `lastMessageAt` and `latestMessagePreview`
5. Link provider event to Lead

Profile lookup failure never rejects the webhook. Fallback names: `Instagram user` / `Facebook user`.

## Profile lookup

| Connection                  | Graph host            | Token                      |
| --------------------------- | --------------------- | -------------------------- |
| Instagram Login             | `graph.instagram.com` | Instagram long-lived token |
| Instagram via Facebook Page | `graph.facebook.com`  | Page access token          |
| Facebook Messenger          | `graph.facebook.com`  | Page access token          |

Routing uses stored `MetaConnectedAccount.platform` and `scopes` (`instagram_business_*` → Instagram Graph).

Facebook real names require Meta **Business Asset User Profile Access** (App Review). Until approved, NBOS stores messages and shows `Facebook user` fallback.

## Lead naming

- Instagram title: `displayName` → `@username` → `Instagram user`
- Instagram subtitle: `@username` → `displayName` → `Instagram user`
- Facebook title: `firstName lastName` → `displayName` → `Facebook user`
- Facebook subtitle: `Facebook Messenger`

Manual CRM edits are preserved: Lead `name` / `contactName` are only overwritten when still generic Meta fallback values.

## MVP lifecycle

Same sender on the same connected account always reuses the same Lead and conversation, regardless of Lead status. New messages append to `MetaMessage`.

## Deferred

- Meta Inbox UI, outbound replies, attachments UI, BullMQ profile enrichment, Lead lifecycle split rules, legacy Lead backfill
