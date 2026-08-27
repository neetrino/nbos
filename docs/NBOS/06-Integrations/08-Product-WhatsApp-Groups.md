# Product Client WhatsApp Conversations (NBOS)

> Canon status: **approved Product communication binding model**.
>
> Messenger decisions: `../02-Modules/09-Messenger/08-Messenger-Decision-Register.md` (`M-WA-*`, `M-WHATSAPP-01`).
>
> Migration safety: `../02-Modules/09-Messenger/10-Messenger-Runtime-Reconciliation.md`.

## 1. Ownership model

A physical WhatsApp group is an external communication conversation. It is **not** rigidly owned by exactly one Product.

Products connect to external conversations through purpose-based bindings.

Initial purposes:

```text
WORK
FINANCE
```

Target relation:

```text
Product
  -> ProductCommunicationBinding (purpose)
       -> Client Messenger Conversation
            -> ExternalConversationMapping
                 -> WhatsApp group id
```

One WhatsApp group may therefore serve:

- one Product;
- multiple related Products (for example Website + SEO);
- multiple Product FINANCE destinations for the same client/Project.

### Why

Most Products still use one normal working group, but enterprise clients sometimes deliberately share a working group across related Products or use one finance-only group for several Products. Flexible bindings support both without duplicating physical groups.

---

## 2. Deterministic Product destination rules

For v1:

- every Product has exactly one active canonical `WORK` destination once client communication has been configured;
- Product may have zero or one explicit `FINANCE` destination;
- if explicit FINANCE destination does not exist, `FINANCE` resolves to the Product WORK destination;
- one External Conversation may be bound to many Products;
- one Product must not have multiple competing active WORK destinations.

A Product row does **not** automatically create a WhatsApp group. During initial setup, failed provisioning or migration there may temporarily be no active WORK binding; that is an operational state to resolve, not permission for multiple competing WORK destinations.

Example:

```text
Website
  WORK    -> Group A
  FINANCE -> Finance Group F

SEO
  WORK    -> Group A
  FINANCE -> Finance Group F

CRM
  WORK    -> Group C
  FINANCE -> Finance Group F
```

---

## 3. No silent auto-create

NBOS does **not** create a WhatsApp group merely because a Product row exists.

Group creation/binding remains an explicit business action.

Normal entry points:

- Deal Won handoff for `PRODUCT` / `OUTSOURCE` resolves the Product `WORK` destination;
- Product Client Communication Settings can create/bind/replace WORK or FINANCE destinations;
- retry/reconciliation occurs from explicit settings/actions after failure.

WhatsApp failure never rolls back Product creation or Deal Won.

---

## 4. Deal Won modal — PRODUCT / OUTSOURCE

Deal Won must consciously resolve Product client WORK communication.

Allowed actions:

```text
Create new WORK WhatsApp group
or
Select / bind existing allowed WhatsApp conversation
```

The existing group selector should normally show safe candidates from the current Project/client context rather than every WhatsApp group in the company.

A separate `FINANCE` destination is **not required** to complete normal Deal Won. It may be configured later from Product Client Communication Settings.

### Existing operational behavior to preserve where compatible

- current create uses the existing ensure queue/worker path until Slice 9 replaces/adapts the legacy Product-only model;
- if WAHA/Gateway create fails, Deal Won remains allowed after the create attempt is recorded; retry later;
- binding/pasting an existing provider group id may be persisted while Gateway is unavailable, with provider identity/format validation performed when Gateway is available;
- failed/pending communication setup remains visible and does not roll back Product/Deal state;
- `MAINTENANCE` / `EXTENSION` do not automatically create a second WhatsApp group;
- Extension of an existing Product normally continues to use the Product's existing WORK destination;
- replacing a Product binding never deletes the old physical WhatsApp group;
- `OUTCOME_UNKNOWN` is reconciled rather than blindly retried.

Current legacy DTO/endpoint details such as `whatsappAction`, `whatsappGroupChatId`, `ensureGroupForProduct`, `CREATE_PRODUCT_GROUP`, or a raw `binding.groupChatId` are migration/runtime details, not the target domain contract. Preserve their useful business/error behavior while moving new code to purpose-based bindings.

---

## 5. Selecting an existing group

When creating a new Product, the user may intentionally choose an existing external conversation.

Example:

```text
Product: SEO
WORK destination:
  Select existing -> Website client group
```

This does not merge Product entities. It only means both Products use the same client conversation for the selected purpose.

Binding a Product to a shared group does not automatically grant every Product employee access to that Client conversation or external SEND permission.

When Gateway is available, search/select should be constrained to safe candidates and provider identity should be validated. A paste/bind fallback may remain available for operational recovery, including persisting the provider id while Gateway is temporarily unavailable; the migration must then reconcile that legacy provider identity into `ExternalConversationMapping` without creating a duplicate physical group.

---

## 6. FINANCE destination

A Product may use a separate finance group when the client wants financial communication isolated from operational employees.

Default Neetrino-side participant/access template for a dedicated FINANCE conversation:

- Owner;
- CEO;
- Finance Director;
- relevant Seller;
- relevant Product PM.

Seller and PM are resolved from the Product/business context rather than hard-coded as one global person. Developers and other Product employees are not automatically included. Manual access changes remain possible.

Physical WhatsApp membership and NBOS Client Messenger `READ`/`SEND` authorization remain separate security layers.

If no explicit FINANCE destination exists:

```text
FINANCE -> WORK
```

Therefore the common single-group client requires no second WhatsApp group.

A single Finance group may be bound as FINANCE for several Products.

### Why

A separate FINANCE group exists primarily for larger clients who intentionally keep financial discussion away from operational employees. The default membership reflects that reason instead of copying the WORK team automatically.

---

## 7. Client billing reminders

Subscription / Invoice / Client Service code must resolve destination by Product + communication purpose.

Canonical call semantics:

```text
resolveClientDestination(productId, FINANCE)
```

Resolution:

```text
explicit FINANCE binding?
  YES -> that External Conversation
  NO  -> Product WORK External Conversation
```

All approved automatic payment/money reminders use `FINANCE` purpose, including invoice/payment, subscription, hosting/domain, maintenance/client-service and similar payment reminders.

The Finance module must not directly depend on a raw Product WhatsApp `groupChatId` after cutover.

Existing billing semantics such as reminder language, due-date offsets, tax gates and notification enable/disable rules stay owned by Finance documentation. Existing Product resolution rules based on the billing entity's actual `productId` must be preserved where they remain correct; do not fall back to arbitrary Project products.

Messenger/Gateway receives the resolved business destination and outbound message operation.

### Automatic reminder is not manual chat

Automatic reminder generation and ordinary employee conversation are different operations:

```text
Finance scheduler/business rule
  -> system outbound FINANCE message

Employee opens FINANCE conversation
  -> Client Messenger locked composer
  -> READ/SEND authorization
  -> manual message
```

A dedicated FINANCE group is a full Client conversation, not only a notification endpoint.

Client replies remain in the same physical conversation that received the reminder. If FINANCE fell back to WORK, the reply remains in WORK; no synthetic second Finance conversation is created.

---

## 8. Participants and NBOS access are separate

Do not equate:

1. WhatsApp physical group participants;
2. NBOS Employee access to the Client conversation.

They may overlap but are different security layers.

Suggested WORK participants/access may derive from PM/Product team/Sales according to business policy. Existing participant-sync behavior and role resolution should be inventoried in Slice 0 and reused where compatible rather than silently discarded.

Dedicated FINANCE defaults are Owner, CEO, Finance Director, relevant Seller and relevant Product PM, with explicit/manual exceptions when needed.

Client Messenger enforces separate external `READ` and `SEND` semantics.

Adding another Product binding to a shared group must not silently broaden access.

---

## 9. Client invitation

When NBOS creates a new physical WhatsApp group, client invitation behavior may continue to use the Gateway invite-link flow.

Safe rules remain:

1. retrieve invite link transiently;
2. resolve the intended client Contact;
3. send the invite through the approved outbound path;
4. persist invitation status/provenance, not the long-lived raw invite URL unless explicitly required;
5. failure is visible/retryable and does not roll back Product creation.

For a Product bound to an already existing shared group, do not send a duplicate invitation merely because a new binding was added.

---

## 10. Architecture boundary

```text
NBOS Messaging Core
  -> WhatsApp connector
    -> WhatsApp Gateway
      -> WAHA
        -> WhatsApp
```

Gateway remains transport/session/provider infrastructure.

NBOS owns:

- canonical Client Conversation;
- Product communication bindings;
- participant/access policy;
- business context;
- Finance/CRM/Support integration;
- attention routing;
- AI/customer policy;
- message history/audit.

Gateway connection configuration remains infrastructure/settings behavior. Existing configured Gateway URL/token handling should be reused; it does not change Product communication ownership.

---

## 11. Idempotency and external outcomes

Group creation/binding operations require deterministic idempotency and explicit provider-outcome handling.

The old Product-only key such as:

```text
whatsapp-product-group:create:{productId}
```

must be reconsidered because the target model is purpose-based and may bind existing shared conversations.

Target idempotency identity should include the business operation and relevant binding purpose/target, for example conceptually:

```text
product-communication:create:{productId}:{purpose}
product-communication:bind:{productId}:{purpose}:{conversationId}
```

Exact key format is implementation detail.

`OUTCOME_UNKNOWN` remains a first-class safety state: never blindly create a second physical group when provider submission may already have succeeded.

---

## 12. Reconciliation / scheduler

Do not run a scheduler that scans all Products and creates missing WhatsApp groups automatically.

Creation remains explicit.

Reconciliation may verify recorded pending/outcome-unknown operations, but it must not infer that every Product needs a newly created physical group because the target Product may intentionally share an existing External Conversation.

---

## 13. Product Client Communication Settings

Product settings should expose business destinations rather than one raw WhatsApp field.

Recommended UI:

```text
Client Communication

WORK
  [Create new group]
  [Select existing]
  current destination / status / participants / history

FINANCE
  [Use WORK destination]   # default
  [Create new group]
  [Select existing]
  current explicit destination / status / history
```

The default experience remains simple for the common one-group case, while the backend supports shared and finance-specific groups.

### Current Product Settings UX to preserve/adapt

The latest `main` Product WhatsApp Settings work is useful runtime and should be **REUSE/EXTEND**, not discarded:

- status, create/retry, bind/replace, sync, invitation and operation history remain visible operational tools;
- existing-group search/select remains available when Gateway is configured;
- paste/bind provider group id remains an operational fallback and may persist while Gateway is unavailable;
- a stored legacy `groupChatId` remains visible from DB even when Gateway is not configured, until migration/cutover replaces that field with canonical mapping display;
- Create / Sync / Invite / provider search stay disabled when Gateway is not configured;
- replacing a binding requires an explicit confirmation and must not delete the previous physical WhatsApp group;
- while create is in flight, the UI shows a clear creating state; `FAILED` unlocks retry;
- missing, failed, pending and outcome-unknown states remain visible and never block unrelated Product work;
- status refresh on open/explicit actions is sufficient for the current UI; permanent polling is not required merely for this settings panel.

When the purpose-based model lands, this same UX is presented independently for WORK and optional FINANCE destinations rather than retaining one raw Product WhatsApp field.

---

## 14. Migration from the existing hard Product/group relationship

The target flexible model is **not** implemented by simply removing old unique constraints first.

Required migration order:

1. add canonical External Conversation/provider mapping and Product purpose-binding structures side-by-side with legacy storage;
2. map every existing physical WhatsApp group to exactly one External Conversation while preserving provider/account/chat identity;
3. backfill every existing Product/group relation as `purpose=WORK`;
4. do not auto-create FINANCE bindings — current behavior remains FINANCE fallback to WORK;
5. preserve existing create/bind status, failure/outcome state, invitation/settings/history where available;
6. adapt Deal Won and Product settings to write WORK/FINANCE bindings;
7. switch all business send paths to `resolveClientDestination(productId, purpose)`;
8. verify every existing Product still resolves to its original physical group;
9. verify one External Conversation can be reused by several Products;
10. only then remove the legacy one-to-one Product/group constraints/fields as a separately verified cleanup step.

Do not recreate WhatsApp groups to make database migration easier.

### Why

The existing physical WhatsApp group is an external business resource with real participants/history. The safest migration preserves that resource identity and changes only how NBOS relates Products to it.
