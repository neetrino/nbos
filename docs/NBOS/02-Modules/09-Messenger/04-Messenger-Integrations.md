# Messenger Integrations

> Canon status: **approved cross-module boundaries**.
>
> Decision rationale: `08-Messenger-Decision-Register.md`.

Messaging Core is shared infrastructure, but business ownership remains in the source modules. Messenger stores/serves conversations and message context; it does not become CRM, Tasks, Support, Finance or Drive.

---

## 1. CRM / Sales

Two different conversations may exist around the same Deal:

```text
Client Messenger / Sales conversation
  = real client-visible communication

Internal Messenger / Deal conversation
  = Neetrino-only commercial discussion
```

They are never the same Conversation and never share one composer mode.

Client Sales messages may:

- create/link Lead;
- create/link Deal;
- create Task;
- preserve offer/proof references;
- save attachments through Drive;
- be shared internally as message references.

Deal Won handoff may create/bind the Product WORK client destination according to `05-WhatsApp-and-Product-Communication-Bindings` rules described in the Messenger/WhatsApp canon.

---

## 2. Projects Hub

### Project

Project is primarily aggregate communication context. Project page may show related Product conversations, Deals, active Tasks and optional/lazy General discussion.

Do not force one General conversation for every Project merely because a Project row exists.

### Product

Product has one main internal work conversation shared with its Connected Work Space.

Client communication is not a Product-owned raw WhatsApp id. Product links to Client External Conversations through purpose-based communication bindings such as `WORK` and `FINANCE`.

### Extension

Extension work normally uses the parent Product work conversation and Product Connected Work Space. Extension does not create a second internal Product conversation or a second client WhatsApp group by default.

If an Extension creates a new commercial Deal, that Deal has its own internal Deal discussion while actual delivery remains in the Product work context.

---

## 3. Tasks and Work Spaces

### Task

Task human Discussion is provided by Messaging Core and embedded in Task Card.

Task keeps its own business fields and Activity Feed. Messenger does not own Task status/assignee/checklist/completion rules.

Messages may create a Task from any allowed Internal or Client conversation. Selected source messages become references/context, not a blind text-to-task conversion.

### Connected Product Work Space

Uses the same internal work Conversation as Product.

### Standalone Work Space

May have its own internal Work Space conversation.

---

## 4. Support

Support intake may originate from a Client Messenger message.

Canonical flow:

```text
Client Messenger message
  -> create/link Support Ticket when tracking/SLA is needed
  -> triage/category/coverage/assignee in Support
  -> execution through Tasks/Work Space
  -> client reply/update through original Client Messenger conversation
```

Support Ticket is internal case management. It may display references to external messages but does not own a second public client composer.

Ticket internal discussion, if needed, is internal-only.

---

## 5. Finance

Finance uses Client Messenger as a communication delivery surface, not as financial source of truth.

Finance state remains in Finance:

- Invoice;
- Payment;
- Subscription;
- Client Service;
- Expense/etc.

Automatic client communication resolves destination by Product + purpose.

Typical mapping:

```text
Subscription reminder          -> FINANCE
Invoice payment reminder       -> FINANCE
Hosting/domain/service payment -> FINANCE
```

Resolver behavior:

```text
Product explicit FINANCE destination?
  YES -> use FINANCE conversation
  NO  -> fall back to Product WORK conversation
```

Finance code must not directly depend on WAHA or a raw Product `groupChatId`.

When Notifications/Finance sends a WhatsApp message, the outbound Message must be persisted in Client Messenger so conversation history is complete.

---

## 6. Client / Company / Contact

Client/Company/Contact remain owned by CRM/Clients modules.

Client Messenger may show:

- mapped Contact/Company;
- related Project/Product(s);
- Sales conversation;
- Product WORK/FINANCE conversations;
- relevant Support Ticket references;
- related Deals;
- channel/provider identity.

A shared physical WhatsApp group may be linked to multiple Products; therefore one Client conversation cannot always be reduced to exactly one Product id.

---

## 7. Drive

All Messenger files use Drive File Assets:

- internal attachments;
- client screenshots;
- documents;
- voice/video where supported;
- support evidence;
- finance PDFs;
- files referenced by Tasks.

Messenger stores links/context; Drive owns physical storage and lifecycle.

A message reference to an attachment does not bypass Drive authorization.

---

## 8. Mail

NBOS Mail remains a separate module.

| Messenger | Mail |
| --- | --- |
| `Conversation / Message` | `EmailThread / EmailMessage` |
| realtime chat UX | email inbox/thread UX |
| WhatsApp/Meta/internal chats | IMAP/Gmail/SMTP/provider sync |
| chat provider mapping | RFC/email threading metadata |

Messenger and Mail may link to the same Deal/Project/Ticket, but they do not share one persistence store.

---

## 9. Notifications

Notifications decides when/how an Employee is notified.

Messenger owns:

- conversation/message history;
- unread/read state;
- mentions;
- provider delivery history for external messages.

Notifications may deliver alerts through push/in-app/Telegram/etc without turning those notification deliveries into separate Messenger conversations.

Telegram employee notifications are independent from the one-time Telegram chat migration decision.

---

## 10. WhatsApp Gateway

WhatsApp Gateway remains the canonical transport boundary.

```text
NBOS Messaging Core
  -> WhatsApp connector
    -> WhatsApp Gateway
      -> WAHA
        -> WhatsApp
```

Gateway responsibilities:

- session/QR/provider transport;
- outbound transport request;
- inbound provider webhook/event normalization as agreed by Gateway contract;
- ack/status/session health;
- provider-specific ids.

NBOS responsibilities:

- canonical Conversation/Message;
- business links;
- Product communication bindings;
- Employee access and SEND permission;
- routing/attention;
- CRM/Support/Finance integration;
- AI context/policy;
- audit/business history.

The existing Gateway should be extended bidirectionally rather than replaced by a second WhatsApp service.

---

## 11. Telegram

Target state for internal chat is:

```text
selected Telegram work groups
  -> one-time controlled migration/import
  -> NBOS Internal Messenger
  -> NBOS Web + Mobile primary use
```

Permanent two-way Telegram project-chat synchronization is not the target architecture.

Telegram Bot notifications may remain as a separate Notifications integration.

---

## 12. AI Platform

### Client Messenger

AI Platform may provide controlled customer-facing capabilities such as:

- draft reply;
- future operator/automation mode;
- message-context analysis;
- `Create Task with AI` proposal.

Every AI action remains subject to exact Employee/Agent/Conversation/Product/channel scopes and customer-facing AI policy.

AI draft/generation permission does not imply external SEND permission.

### Internal Messenger

No customer-facing AI operator exists in Internal Messenger.

Future internal AI helpers may operate as explicit actions under AI Platform capabilities, but they do not silently impersonate Employees in team conversations.

---

## 13. Platform Access / RBAC

Messenger effective access composes:

- module permission;
- Product/Project/Work Space/Task participation where relevant;
- conversation participant/access rules;
- manual invite/grant;
- role/personal policy;
- management/owner policy;
- separate Client `READ` and `SEND` capability.

Adding a Product to a shared external conversation does not automatically grant all Product participants external SEND permission.

Collections never grant conversation access.

---

## 14. Credentials

Passwords, tokens and secrets do not belong in Messenger.

If a secret is posted accidentally:

- redact/delete according to policy;
- move the actual secret to Credentials;
- optionally leave a safe link/reference to the Credential record for authorized users.
