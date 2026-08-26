# Task Card UX Plan

> NBOS Platform — implementation plan for the compact, functional Task card/sheet.
>
> Messenger decision: `../09-Messenger/08-Messenger-Decision-Register.md` (`M-TASK-01`, `M-TASK-02`, `M-MESSAGE-01`).

## Goal

The Task card is the main execution surface for a Task: compact enough for daily use, but complete enough that users can execute work and discuss it without leaving the card.

## Product Requirements

- Header shows Task title, code, status, priority, readiness and primary actions.
- Main Task fields are editable inline: title, description, status, priority, start date, due date and assignee.
- Completion rules are visible before completion and show concrete blockers when completion is denied.
- Checklists are operational: create checklist, add item, toggle item, remove item and remove empty/obsolete checklist.
- Linked entities, parent Task, subtasks, people and dates are visible in a scan-friendly structure.
- Right-side Discussion is the **canonical Messaging Core Task Conversation**, not local sheet notes and not a separate `task_discussion_entries` comments engine.
- System Activity remains a separate Task-owned history layer, even if Discussion and Activity are presented together in the same right rail.
- Buttons perform real actions or are disabled/hidden with a clear reason.
- Layout stays compact on desktop and collapses cleanly on narrow screens/mobile.

## UX Shape

Recommended desktop shape:

```text
Task execution / properties        Discussion / Activity
--------------------------------   --------------------------------
status / priority                  human messages
assignee / dates                   mentions / replies
checklist                          attachments
links / subtasks                   source message references
completion rules                   system activity events
```

- Right sheet width: wide enough for a two-column execution surface without unnecessarily covering the whole app.
- Left rail: Task properties, rules, links, subtasks and checklists.
- Right rail: Task Discussion + Activity with a message composer.
- Visual style: NBOS minimal operational UI, low decoration, clear borders, restrained status colors, icon-first controls where obvious.

## Discussion Contract

Task Discussion follows the shared Messaging Core canon:

- the Task conversation is lazy-created when real discussion begins;
- opening the Task does not need to create an empty Conversation row if nobody writes;
- Task Card and Internal Messenger `Tasks` view open the same underlying conversation/messages;
- attachments are Drive File Assets;
- replies/reactions/read state/mentions use common Messenger behavior;
- selected Internal or Client messages may create a Task and become stable source references;
- closing a Task does not delete its Discussion history;
- closed inactive Task conversations may leave active Messenger lists while remaining reachable from the Task/search.

### Why

A second Task-only comments engine would duplicate Messenger behavior and eventually diverge on attachments, mentions, search, mobile and read state. One Conversation/Message engine keeps discussion consistent across Tasks, Products and Work Spaces.

## Activity Contract

Activity Feed remains Task-owned system history, for example:

- Task created;
- status changed;
- assignee changed;
- deadline changed;
- checklist item changed;
- automation fired;
- completion/reopen event.

Human Discussion messages are not converted into Activity rows, and Activity rows are not fake human messages.

## Create Task from Message

When a Task is created from one or multiple Messenger messages:

- selected messages become source references/context;
- available Project/Product/Conversation context may be prefilled;
- the user still defines the actual Task title/description/assignee/links;
- Task creation is not a blind conversion of message text into a Task;
- future `Create Task with AI` may propose structured fields from authorized context, but Employee confirmation remains required.

## Implementation Notes

- Reuse existing Task endpoints for Task-domain mutations (`PUT /tasks/:id`, status actions, links, checklist CRUD) where they remain correct.
- Discussion backend wiring must go through Messaging Core rather than local notes.
- Remove/avoid local sheet-session notes once canonical Messenger wiring is available; local notes must not become a parallel persistence model.
- Do not add broad unrelated Task features here unless the backend domain is ready.
- The implementation slice must reconcile any existing Task discussion persistence before migration; do not destructively delete historical discussion data without mapping/parity evidence.

## Acceptance Criteria

- User can open a Task, edit core fields, start/hold/complete/reopen it and see surrounding Task views update.
- User can manage checklist structure/items without refresh.
- Completion blockers are shown in context and clear after valid updates.
- Human messages sent from Task Card appear in the same canonical Task Conversation visible from Internal Messenger.
- Messages sent from Internal Messenger Task view appear in Task Card without a second storage path.
- Task Activity remains visible and distinct from human Discussion.
- Task created from Messenger source message(s) preserves stable references and `Open source` behavior.
- Closed Task retains discussion history.
- Empty states are quiet and compact.
- Relevant web/API typecheck/tests pass.
