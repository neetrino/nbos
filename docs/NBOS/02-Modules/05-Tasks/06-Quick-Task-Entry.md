# Quick Task Entry

> Tasks module canon for the first NBOS Quick Action. Approved 2026-09-12. Cross-platform Quick Actions UX: `../../05-UI-Specifications/13-Quick-Actions.md`.

## 1. Product intent

`Quick Task` is an alternative fast entry into the existing Tasks module, not a separate task product.

The use case is deliberately narrow:

```text
phone home screen
→ one tap
→ existing quick-create task form
→ create
```

The user should not need to open Dashboard, navigate to Tasks, wait for the task list, and then press New Task.

At the same time the entry is not a dead end: while the create form is being used, the ordinary Tasks surface is prepared in the background so the user can close the form and immediately inspect/edit tasks.

Canonical route:

```text
/quick/task
```

---

## 2. One Task model, one create flow

Quick Task uses the same:

- `Task` entity;
- Tasks REST API;
- RBAC and record rules;
- current Employee identity;
- `QuickCreateTaskDialog`;
- mobile bottom-sheet behavior;
- assignee relation picker;
- due-date component;
- priority behavior;
- validation and error handling.

The Task module must not gain a second quick-only model or endpoint.

If the normal mobile Quick Create form is improved later, `/quick/task` must receive that improvement through the same shared component.

---

## 3. Existing runtime that must be preserved

The current web runtime already provides important building blocks:

- shared `apps/web/src/components/shared/quick-create-task/QuickCreateTaskDialog.tsx`;
- task feature re-export at `apps/web/src/features/tasks/components/QuickCreateTaskDialog.tsx`;
- responsive `DialogContent` that becomes the standard mobile bottom sheet;
- `useTaskCreatorId()` using current `/api/me` Employee identity;
- `tasksApi.create()` → normal `POST /api/tasks`;
- `/tasks` list/detail flow;
- `task-created-sync.ts` / `usePrependExternallyCreatedTask()` for inserting a task created outside the current Tasks page.

Quick Task should compose these capabilities rather than replace them.

---

## 4. Launch lifecycle

The create surface has priority over the module surface.

```text
/quick/task opened
│
├─ priority 1: open existing QuickCreateTaskDialog
│              └─ title input becomes interactive
│
└─ priority 2: load existing Tasks surface/data in background
```

The task list, stats, My Plan stages, Messenger persistence or other heavy application work must not become a prerequisite for typing a task title.

The implementation may refactor current `/tasks` UI into a reusable surface if required. This refactor must preserve ordinary `/tasks` behavior and avoid a second Tasks implementation.

---

## 5. Creator and assignee rules

### Creator

Human Quick Task creation always uses the current authenticated Employee as creator.

The quick entry does not expose creator switching.

If identity bootstrap is still loading:

- title/description input may already be usable;
- submit remains disabled until a real creator Employee ID is ready;
- identity readiness must not reset the draft.

### Default assignee

Default assignee is the creator/current Employee, matching the existing quick-create behavior.

### Assigning another employee

Choosing another employee is a first-class flow, because many tasks are created for another team member.

Employee options/search are secondary data:

- they must not block first paint or title input;
- normal server search remains authoritative;
- initial/recent employee options may be prepared in memory after the form is interactive;
- user-selected assignee must never be overwritten by a late bootstrap/default.

---

## 6. Draft safety

Quick Task adds a stronger draft-safety requirement to the shared create flow.

The current-user or employee data may arrive after the modal has opened. A late update must not invoke a reset that clears user input.

Required invariant:

```text
Once the user starts editing,
background/bootstrap data may enrich the form,
but may not replace user-owned draft state.
```

This applies to:

- title;
- description;
- priority;
- due date;
- manually selected assignee.

The implementation must explicitly test the case where the user types before `/api/me` settles.

---

## 7. Close and edit behavior

Closing/cancelling Quick Create does not close the Quick Task application surface.

Expected result:

```text
Quick Create closes
→ existing Tasks surface is visible
→ task can be selected
→ existing TaskSheet/edit flow opens
```

If the background list did not load successfully, show the normal Tasks error/retry behavior. Do not keep the user trapped behind the create form.

---

## 8. Successful creation

After create:

1. use the normal successful Task returned by the existing API;
2. update the background Tasks view without a full reload;
3. preserve existing ordering/filter rules as far as the created task belongs to the current scope;
4. show success feedback;
5. allow immediate `Open` / equivalent to inspect the created Task using the existing Task detail flow.

Existing task-created synchronization should be reused or extended instead of inventing another page-specific event mechanism.

The form should not silently close the whole installed Quick Action after submit.

---

## 9. Permissions and errors

Quick Task has exactly the same effective permission as ordinary task creation.

Cases:

- user cannot create tasks → the action is not usable and the UI explains why;
- authenticated account is not linked to an Employee → preserve the existing blocked-creator behavior;
- create API rejects input → preserve draft and show normal API error;
- employee lookup fails → do not destroy the task draft;
- background list fails → create may still work if identity/create dependencies are valid.

No permission is granted merely because the user opened `/quick/task` from a home-screen icon.

---

## 10. Installation / icon

The desired phone UX is a dedicated visible action such as:

```text
[ NBOS ]   [ + Task ]
```

The Quick Task install surface must start at `/quick/task` and use task-specific name/icon metadata. The ordinary NBOS install remains unchanged.

Because browser installation behavior differs between iOS and Android, live QA must verify the exact second-icon experience. When a browser cannot provide a clean independent second web-app install, an OS/home-screen shortcut to `/quick/task` is an accepted delivery fallback.

This is a delivery concern only; the route and domain behavior stay identical.

---

## 11. Cache policy

Quick Task does not introduce offline Tasks.

First release:

- no cached authenticated HTML/RSC;
- no cached `/api/me`;
- no cached Tasks API data in service worker;
- no offline create queue;
- no persistent offline employee directory.

Fast startup comes from a small critical UI path, code splitting/lazy background work, reuse of browser-cached immutable assets, and avoiding unnecessary module initialization before the form is interactive.

---

## 12. Performance and acceptance

Measure at least:

```text
launch → form visible
launch → title interactive
launch → identity ready
launch → background Tasks ready
submit → API success/failure
```

Never log task content in these metrics.

Quick Task acceptance requires:

- same mobile form/component as ordinary NBOS;
- autofocus on title and no task-list dependency before typing;
- creator=current Employee;
- default assignee=current Employee and changing assignee works;
- late identity/background data does not reset draft;
- create uses normal API/RBAC;
- newly created task reaches the background Tasks state;
- close reveals Tasks and existing edit/detail behavior;
- normal `/tasks` behavior has no regression;
- normal NBOS PWA/install behavior has no regression;
- service worker remains safe for authenticated operations.

---

## 13. Relationship to future Quick Actions

Tasks owns only Quick Task domain behavior. Cross-cutting launch behavior belongs to the Quick Actions foundation.

A future Quick Expense or Quick Note must not depend on Tasks code. It may reuse the same Quick Action shell/lifecycle, but it must reuse its own Finance/Notes domain form and API.
