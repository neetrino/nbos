# Product WhatsApp Groups (NBOS)

## Ownership

**One Product → one WhatsApp group.**  
A Project may have many Products; each Product has its own group.  
NBOS never owns groups at Project level for this automation.

## Mandatory auto-create

When any Product is persisted (manual create, Deal Won shell, early delivery), NBOS enqueues `CREATE_PRODUCT_GROUP`.  
There is **no** enable/disable automation switch.

WhatsApp failures never roll back Product creation.

## Deal action

Deal Actions → **Create WhatsApp group** calls:

`POST /api/crm/deals/:id/whatsapp-group/ensure`

Product resolution order:

1. `Deal.existingProductId`
2. Linked `Order.productId`

If unresolved → `409 DEAL_PRODUCT_NOT_READY`.  
Never `Project.products[0]`. Never create Product from this action.

## Client billing reminders

Subscription / related Invoice payment reminders resolve the WhatsApp group via **`subscription.productId`** (Product WhatsApp Group).  
NBOS never uses a Project-level group for these client billing messages.

Message language comes from **`Subscription.reminderLanguage`** (`HY` | `RU` | `EN`, default `HY`).  
Schedule: pre-due offsets **D-10** and **D-2** vs `Invoice.dueDate` (Asia/Yerevan calendar); one send per invoice per offset.

## Participants

Initial (when phones are valid):

- Sales Manager (`Deal.sellerId`)
- Sales Assistant (`Deal.sellerAssistantId`)
- Project Manager (`Product.pmId` → Deal.pmId → PM team slot)
- CEO (`Employee.status=ACTIVE` + `role.slug=ceo`)

Technical Specialist is added only when Product status becomes `DEVELOPMENT` (idempotent).

Client Contact is **never** added as a group participant.

## Client invitation

After group create success:

1. `GET` Gateway invite-link (in memory only)
2. Resolve Contact: `Project.contactId` then Deal contact
3. `normalizePhoneToWhatsAppJid()` (default country `AM`)
4. `POST /api/messages/send` with invite URL in text
5. Persist invitation status — **never store invite URL**

## Architecture boundary

```text
NBOS → WhatsApp Gateway → WAHA → WhatsApp
```

NBOS stores Gateway URL + encrypted Bearer token only (`WhatsAppGatewayConnection`).  
Configure in **Settings → Integrations**. Optional bootstrap: `WHATSAPP_GATEWAY_URL` (DB wins when configured).

## Idempotency

- Create dedupe: `whatsapp-product-group:create:{productId}` (DB + Gateway Idempotency-Key)
- Participant: `whatsapp-product-group:{productId}:participant:{employeeId}`
- Invite: `whatsapp-product-group:{productId}:client-invite:{contactId}:{groupChatId}`

`GROUP_CREATE_OUTCOME_UNKNOWN` → binding `OUTCOME_UNKNOWN` / `NEEDS_RECONCILIATION`.  
Do **not** blind-retry create. Reconcile manually via Product Settings.

## Scheduler

`POST /api/scheduler/whatsapp-product-groups-reconcile` (SCHEDULER_API_KEY)  
Ensures missing bindings and requeues durable ops; skips unknown-outcome recreate.

## Product Settings

Product page → Settings gear → WhatsApp Group section: status, create/retry, bind/replace, sync, invite, history.
