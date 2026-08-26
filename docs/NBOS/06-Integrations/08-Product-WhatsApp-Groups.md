# Product Client WhatsApp Conversations (NBOS)

> Canon status: **approved Product communication binding model**.
>
> Messenger decisions: `../02-Modules/09-Messenger/08-Messenger-Decision-Register.md` (`M-WA-*`, `M-WHATSAPP-01`).

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

- every Product has exactly one active canonical `WORK` destination;
- Product may have zero or one explicit `FINANCE` destination;
- if explicit FINANCE destination does not exist, `FINANCE` resolves to the Product WORK destination;
- one External Conversation may be bound to many Products;
- one Product must not have multiple competing active WORK destinations.

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

- if WAHA/Gateway create fails, Deal Won remains allowed after the create attempt is recorded; retry later;
- binding an existing external group must validate provider identity/format when Gateway is available;
- failed/pending communication setup remains visible and does not roll back Product/Deal state;
- `MAINTENANCE` / `EXTENSION` do not automatically create a second WhatsApp group;
- Extension of an existing Product normally continues to use the Product's existing WORK destination.

The exact DTO names (`whatsappAction`, legacy `groupChatId`, etc.) are runtime details to reconcile during implementation. New code should target purpose-based bindings rather than extending raw Product group fields.

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

---

## 6. FINANCE destination

A Product may use a separate finance group when the client wants financial communication isolated from operational employees.

Typical participants may include company management, Finance, PM/Seller where authorized, and the client's finance/management contacts. Developer/product-team access is not automatic.

If no explicit FINANCE destination exists:

```text
FINANCE -> WORK
```

Therefore the common single-group client requires no second WhatsApp group.

A single Finance group may be bound as FINANCE for several Products.

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

The Finance module must not directly depend on a raw Product WhatsApp `groupChatId`.

Existing billing semantics such as reminder language, due-date offsets, tax gates and notification enable/disable rules stay owned by Finance documentation.

Messenger/Gateway only receives the resolved destination and outbound message operation.

---

## 8. Participants and NBOS access are separate

Do not equate:

1. WhatsApp physical group participants;
2. NBOS Employee access to the Client conversation.

They may overlap but are different security layers.

Suggested WORK participants/access may derive from PM/Product team/Sales according to business policy.

Suggested FINANCE access may derive from Finance/management/explicit invites.

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
