# Messenger Permissions and UX

> Canon status: **approved UX/security direction**.
>
> Decision rationale: `08-Messenger-Decision-Register.md` (`M-BOUNDARY-*`, `M-COLLECTIONS-01`, `M-SECURITY-*`, `M-ROUTING-01`).

Messenger must be fast enough to replace Telegram/WhatsApp workarounds, but Client Messenger must also make accidental external communication difficult.

The core principle is:

```text
one Messaging Core
!=
one Messenger UI
```

Internal Messenger and Client Messenger are separate working surfaces.

---

## 1. Entry points

NBOS exposes two explicit entry points:

```text
Internal Messenger
Client Messenger
```

They may appear in different navigation locations/shortcuts according to the final app shell, but they must not be reduced to one screen with a casual zone toggle.

Entity pages may open contextual panels/drawers that deep-link to the correct surface:

- Product internal `Chat` -> Internal Messenger conversation;
- Work Space `Discussion` -> same Internal Product/work conversation when connected;
- Task `Discussion` -> Internal Task conversation;
- Deal internal discussion -> Internal Messenger;
- Client/WhatsApp action -> Client Messenger.

---

## 2. Visual separation

Internal and Client Messenger may share component primitives, but the user must recognize the surface instantly.

Client Messenger should differ through a combination of:

- distinct accent/background treatment;
- explicit client/channel iconography;
- `Client visible` / external-send state;
- provider/channel label;
- Contact/Company/Product context;
- delivery status;
- locked/unlocked composer;
- stronger audit/access actions;
- client AI/operator controls where enabled.

Internal Messenger should remain visually lighter and not show external-send warnings.

---

## 3. Internal layout

Recommended desktop layout:

```text
Internal navigation / tabs
Left: conversation list
Center: timeline
Right: optional entity/context panel
```

Primary navigation:

```text
All | Products | Tasks | Deals | Work Spaces | Groups | Direct | Collections
```

Daily lists are flat. Project hierarchy/context is available from entity navigation or contextual panels rather than forced into every chat list.

---

## 4. Client layout

Recommended desktop layout:

```text
Client navigation
Left: conversation list / attention inbox
Center: client timeline
Right: client/product/channel/context panel
```

Primary navigation:

```text
Inbox | Sales | Clients | Collections
```

Client conversation header should show enough context to make the target unmistakable:

- client/company/contact;
- Product(s) / Project context where known;
- provider/channel;
- WORK/FINANCE purpose when relevant;
- attention owner/team;
- AI/operator status where applicable.

---

## 5. Locked Client composer

Client conversation opens in a safe read-only state.

Example:

```text
[🔒 Client conversation]
WhatsApp · Degusto · Website

[ Reply to client ]
```

An Employee with external SEND permission explicitly activates the composer for the current conversation working session.

Unlocked composer example:

```text
[CLIENT VISIBLE]
Sending via WhatsApp

Type a message...
```

Rules:

- switching/leaving the conversation re-locks;
- optional inactivity timeout may re-lock;
- permission is checked again on send;
- no `Internal | Public` toggle exists inside this composer;
- read-only users never receive a usable send composer;
- Client message actions that create internal work do not require unlocking external send.

### Why

One deliberate unlock creates a conscious safety boundary without forcing a confirmation dialog before every message in an active client conversation.

---

## 6. Permissions model

Effective Messenger access may combine:

1. module-level RBAC permission;
2. linked Project/Product/Task/Work Space/Deal participation;
3. direct conversation membership;
4. explicit/manual invite or grant;
5. role/personal access policy;
6. management/owner override where platform canon allows it.

Client Messenger additionally separates:

```text
CLIENT_CONVERSATION_READ
CLIENT_CONVERSATION_SEND
```

Exact permission key names are implementation details; semantic separation is canonical.

A user may therefore:

- see a client conversation but not send;
- be invited temporarily to inspect history;
- receive SEND only for selected conversations according to role/policy.

Adding a Product binding to a shared WhatsApp conversation does not automatically grant its whole Product team external SEND.

---

## 7. Attention routing vs access

Access answers:

> Who may see/read/send?

Attention routing answers:

> Who currently owns the need to respond/triage?

Defaults:

```text
Delivery WORK conversation     -> Product PM
Maintenance WORK conversation  -> Support Intake
FINANCE conversation           -> Finance/authorized queue
```

Attention may be reassigned manually without changing conversation access or identity.

UI should make attention ownership visible in Client Messenger Inbox and conversation context.

---

## 8. Conversation cards

Common fields:

- title;
- last-message preview;
- unread count;
- last activity;
- participants/context;
- pin/mute/archive;
- mention badge.

Internal entity cards may additionally show:

- Product/Task/Deal/Work Space type;
- task status/assignee/due date;
- Product delivery stage/deadline;
- quick `Open Entity` action.

Client cards may additionally show:

- provider/channel icon;
- Client/Product context;
- WORK/FINANCE purpose;
- attention owner;
- needs-response state;
- delivery failure warning;
- AI/operator state if enabled.

---

## 9. Collections

Internal and Client surfaces each have separate Collections.

Rules:

- `Favorites` is a built-in personal Collection in each surface;
- custom Collections may be `PERSONAL` or `SHARED`;
- conversation can belong to multiple Collections;
- a shared Collection does not grant conversation access;
- users see only Collection items they already have permission to access;
- Internal Collections reject Client conversations;
- Client Collections reject Internal conversations.

This is a navigation/organization layer only.

---

## 10. Message selection/actions

Where authorized, user may select one or multiple messages.

Common actions:

- Reply;
- Create Task;
- Share/Forward reference internally;
- Copy/Open source.

Client-specific actions may include:

- Create/link Support Ticket;
- Create/link Deal/Extension Deal;
- Invite Employee;
- open Product/Client/CRM context.

Selected messages are passed as source references/context. They are not blindly copied as a new source of truth.

---

## 11. Task card UX

Task Card remains an execution surface, not a redirect to a separate comments page.

Recommended desktop behavior:

```text
Task details / execution       Discussion / Activity
```

Discussion is the Messaging Core Task Conversation.

Activity Feed is system history and remains a separate domain layer.

Task conversation may also be opened from Internal Messenger `Tasks`, but both entry points use the same messages.

---

## 12. Threads/replies

Reply/thread primitives may be supported for longer discussions.

Do not force every forwarded Client message or short Task/Product discussion into a separate thread. Normal timeline discussion is the default; threads are an optional organization tool.

---

## 13. AI UX boundary

Client Messenger may show AI controls such as draft/operator enable/disable/pause/manual takeover according to AI Platform policy.

Internal Messenger does not show the customer-facing AI operator.

Generic approved AI actions such as future `Create Task with AI` are separate contextual actions and do not change the Internal/Client safety boundary.

---

## 14. Mobile

Mobile must preserve the same two-surface separation.

Target state:

- Internal Messenger is a first-class mobile work surface;
- Client Messenger is a separate client-facing mobile surface with locked composer and external context;
- notification deep links always open the correct surface;
- no notification opens an ambiguous shared composer.

This separation is required for the target one-time Telegram migration strategy to be viable.

---

## 15. Conversation lifecycle

| State | Meaning |
| --- | --- |
| `active` | Normal working list |
| `muted` | Reduced notifications according to user preference |
| `archived` | Hidden from active list; accessible from entity/search |
| `locked` | History readable; new messages forbidden |

Entity closure does not delete conversation history.

Client composer lock/unlock is a **send-safety session state**, not the same thing as a permanently `locked` Conversation lifecycle state.
