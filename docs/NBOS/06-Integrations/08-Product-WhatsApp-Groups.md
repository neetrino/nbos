# Product WhatsApp Groups (NBOS)

## Ownership

**One Product → one WhatsApp group.**  
A Project may have many Products; each Product has its own group.  
NBOS never owns groups at Project level for this automation.

## No silent auto-create

NBOS does **not** enqueue `CREATE_PRODUCT_GROUP` when a Product is persisted or when a Deal is marked Won / early-delivery shell is created.

`ensureGroupForProduct` stays. Create happens only from:

- Deal / Product Settings **Create WhatsApp group** (or retry)
- the **Deal Won** modal for `PRODUCT` / `OUTSOURCE` (create button, or `whatsappAction: create` on `PATCH /crm/deals/:id/status` when the product shell does not exist yet)

Partner `createFinanceFromPartnerServiceTerm` ensure is unchanged.

WhatsApp failures never roll back Product creation or Deal Won.

## Deal Won modal (PRODUCT / OUTSOURCE)

Before `WON`, Sales must consciously **Create WhatsApp group** or **paste an existing group ID**. There is no Skip.

- Create uses the existing ensure queue + worker. If WAHA is down and create **FAILED**, Mark as Won is still allowed; retry later from Deal / Product Settings.
- Saving a group ID persists `binding.groupChatId` even when Gateway/WAHA is unreachable. If Gateway is up, NBOS still validates `@g.us` and uniqueness. A raw numeric id gets `@g.us` appended.
- Mark as Won stays disabled until create or ID in this session, **or** the product already has `groupChatId` or a `CREATE_PRODUCT_GROUP` operation (including `FAILED`).
- `MAINTENANCE` / `EXTENSION` do not show this modal and do not create a second group.

API blocks `PATCH …/status` → `WON` the same way. When no Product exists yet (shell is created during Won), the client sends `whatsappAction: create | bind` (and `whatsappGroupChatId` for bind). The Won handler runs create/bind **after** `ensureProduct` in the same flow. This matches the existing status PATCH instead of requiring `existingProductId` before Won.

Missing / failed / pending groups stay visible (Deal sheet, Product Settings, product list row) and never block other work.

## Deal action

Deal Actions → **Create WhatsApp group** calls:

`POST /api/crm/deals/:id/whatsapp-group/ensure`

Product resolution order:

1. `Deal.existingProductId`
2. Linked `Order.productId`

If unresolved → `409 DEAL_PRODUCT_NOT_READY`.  
Never `Project.products[0]`. Never create Product from this action.

## Client billing reminders

Subscription / related Invoice payment reminders resolve the WhatsApp group via **`subscription.productId`**. Client Service invoices without a subscription use **`ClientServiceRecord.productId`**.  
NBOS never uses a Project-level group for these client billing messages.

Message language comes from **`Subscription.reminderLanguage`** or **`ClientServiceRecord.reminderLanguage`** (`HY` | `RU` | `EN`, default `HY`).  
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
2. Resolve Contact: `Product.contactId` → `Project.contactId` → Deal contact
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

Batch reconcile (cron and `POST /api/scheduler/whatsapp-product-groups-reconcile`) is **removed**.  
Do not scan products without a group — migrated records must stay untouched.  
Create only from an explicit Deal / Product Settings action or the Deal Won modal (`PRODUCT` / `OUTSOURCE`).

## Product Settings

Product page → Settings gear → WhatsApp Group section: status, create/retry, bind/replace, sync, invite, history.  
While create is in-flight the button shows **Creating group…**; `FAILED` unlocks retry. Status updates on open and after the click, not via live poll. Missing and `FAILED` states are shown as a clear badge; retry/create never blocks other work.
