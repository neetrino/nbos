# Internal Messenger

> Canon status: **approved product architecture**.
>
> Decision rationale: `08-Messenger-Decision-Register.md` (`M-BOUNDARY-01`, `M-INTERNAL-*`, `M-COLLECTIONS-01`, `M-PROJECT-01`, `M-WORK-*`, `M-TASK-*`, `M-MESSAGE-*`).

`Internal Messenger` is the Neetrino-only communication surface. Nothing sent from this surface can be delivered to a client/provider conversation.

It uses the shared Messaging Core but has its own navigation, visual identity, collections, permissions and actions.

---

## 1. Primary navigation

```text
All
Products
Tasks
Deals
Work Spaces
Groups
Direct
Collections
```

The daily lists are flat and optimized for fast access. Project hierarchy is context, not a mandatory navigation step.

### Why

The team communicates primarily around Product work, Tasks, Deals, operational Work Spaces, internal groups and direct messages. Requiring `Project -> Product -> Chat` for daily communication adds unnecessary depth.

---

## 2. `All`

`All` is the Internal attention inbox:

- all accessible active conversations;
- sorted by recent activity;
- `Unread` filter;
- `Mentions` filter;
- search;
- pin/mute/archive state;
- clear context badges such as Product, Task, Deal, Work Space or Group.

Example:

```text
Website · Degusto                 Product
Fix payment callback              Task
Marketing                         Group
Extension #14                     Deal
CEO planning                      Work Space
Ruben                             Direct
```

`All` is **not** a giant Project hierarchy tree.

### Why

The purpose of `All` is to answer: “what active communication needs my attention now?” Context trees remain available from Project/Product/entity pages when needed.

---

## 3. Products

A Product has one main internal work conversation.

For a Product with its mandatory Connected Work Space:

```text
Product
  ↕
Connected Work Space
  ↕
ONE Conversation
```

User-facing names may differ by surface:

- Product page: `Chat`;
- Work Space: `Discussion`;
- Internal Messenger: Product name.

All entry points resolve to the same underlying `conversationId`.

The conversation continues through Development, QA, Transfer, Maintenance and Extensions related to that Product unless there is a deliberate business reason to create another internal context.

Context actions may include:

- Open Product;
- Open Project;
- Open Work Space;
- Open Tasks;
- Open related Deals/Extensions;
- Open Drive/Product Library;
- Open Support context;
- Open permitted Finance context.

### Why

Product and its Connected Work Space represent the same delivery work. Separate Product Chat and Work Space Chat would split decisions/history into two competing conversations.

---

## 4. Tasks

Task Discussion uses the same Messaging Core as the rest of Internal Messenger.

The primary Task UX is the Task card/sheet:

```text
Task execution fields        Discussion / Activity
status                       human messages
assignee                     attachments
priority                     mentions
checklist                    source references
links                        system activity
```

Rules:

- Task Discussion is not a separate `task_discussion_entries` comments engine;
- Task conversation is lazy-created when actual discussion starts;
- a Task with no discussion does not need an empty conversation row merely because the Task exists;
- Task card and Messenger `Tasks` view open the same conversation;
- closed inactive Task conversations leave active daily lists but remain reachable from Task/search/history;
- human Discussion and system Activity Feed remain different domain layers even if shown side-by-side.

Task conversation cards should show useful work metadata such as status, assignee, due date and source Product/Work Space.

### Why

A single discussion engine prevents users and developers from maintaining two different messaging/comment systems with different attachments, mentions, read state and mobile behavior.

---

## 5. Deals

`Deal` conversation is internal pre-sale/commercial discussion.

Used for:

- offer preparation;
- internal sales questions;
- negotiation strategy;
- handoff preparation;
- internal commercial notes that the client must not see.

It is **not** the client Sales conversation. The real client conversation lives in Client Messenger.

After Deal Won, the Deal discussion remains as historical internal commercial context; Product delivery uses the Product/Connected Work Space conversation.

---

## 6. Work Spaces

### Connected Product Work Space

Does **not** create a second conversation. It reuses the Product work conversation.

### Standalone Work Space

A standalone operational Work Space may have its own conversation, for example:

- Marketing strategy;
- Finance operations;
- CEO planning;
- internal long-running operational direction.

The `Work Spaces` tab should avoid duplicating Product conversations already present under `Products`; its primary purpose is standalone Work Space discussions and any future non-Product work-space types.

---

## 7. Projects

Project is an aggregate context rather than a permanent primary chat category.

A Project page may expose a contextual communication navigator:

```text
Project: Degusto
  General                     # optional/lazy
  Products
    Website
    CRM
  Deals
    Extension #14
  Active Tasks
    Payment callback
```

`Project General` may exist where the team genuinely needs cross-Product discussion, but it is not automatically required for every Project.

### Why

Projects can contain multiple Products and Deals. Forcing a General chat everywhere creates empty or duplicate rooms; entity conversations should exist because people use them, not because hierarchy requires them.

---

## 8. Groups

`Groups` are normal internal team/community conversations not tied to one business entity.

Examples:

- Development;
- Marketing;
- Management;
- Office;
- Photos;
- Random/Humor;
- temporary working groups.

Group access is explicit according to group membership/permissions. A Group may optionally have entity links for context, but it does not become the canonical Product/Task conversation merely because a link exists.

---

## 9. Direct

Direct messages are private internal conversations between Employees according to platform policy.

They use the same core message features where applicable:

- attachments through Drive;
- replies;
- reactions;
- read state;
- message-to-Task action;
- search;
- mute/pin/archive.

---

## 10. Collections and Favorites

Collections are the single custom conversation-grouping mechanism inside Internal Messenger.

```text
Collections
  Favorites                  # built-in PERSONAL collection
  My Active Products         # PERSONAL
  CEO Watch                  # PERSONAL
  Development Priority       # SHARED
```

Rules:

- `Favorites` is a built-in personal Collection;
- user-created Collections may be `PERSONAL` or `SHARED`;
- one conversation may appear in multiple Collections;
- Collections only reference conversations; they do not move/change the canonical conversation;
- adding a conversation to a shared Collection never grants access to it;
- Internal Collections may contain **only Internal conversations**.

### Why Collections instead of labels/folders

The immediate business need is manually assembling selected chats into useful sets. One Collection model solves Favorites and custom grouping without adding separate folder + label + favorite taxonomies.

---

## 11. Message actions

Where permissions allow, any Internal message supports common actions such as:

- Reply;
- select one or multiple messages;
- Create Task;
- Share/Forward reference into another allowed Internal conversation;
- Copy/Open source link.

Creating a Task is a full Task creation flow, not a blind conversion of message body into a Task title. Selected messages become source context/reference; the user still defines the actual Task.

Future `Create Task with AI` may use authorized recent/selected conversation context to propose title/description/links, but the Employee confirms the Task.

---

## 12. References and threads

When messages are forwarded/shared internally, the target conversation receives a reference card with source metadata and `Open original`, not a disconnected duplicate source of truth.

Thread/reply support is allowed, but threads are optional. A forwarded client message or ordinary internal discussion does not automatically create a separate thread.

---

## 13. Lifecycle

Possible conversation state concepts:

| State | Meaning |
| --- | --- |
| `active` | Appears in normal working lists |
| `muted` | Notifications reduced according to user setting |
| `archived` | Hidden from active lists, reachable from entity/search |
| `locked` | History readable, new messages forbidden |

Entity closure does not physically delete conversation history.

---

## 14. Internal AI boundary

Internal Messenger does not contain the customer-facing AI operator used in Client Messenger.

AI may still assist specific approved internal actions in the future (for example `Create Task with AI`), but that is not an autonomous operator replying as an Employee in ordinary Internal chats.
