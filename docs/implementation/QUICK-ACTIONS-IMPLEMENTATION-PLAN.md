# NBOS Quick Actions — Implementation Plan

Date: 2026-09-12  
Status: **canon approved; implementation not started**.  
First slice: `Quick Task` at `/quick/task`.

Product canon:

- `../NBOS/05-UI-Specifications/13-Quick-Actions.md`
- `../NBOS/02-Modules/05-Tasks/06-Quick-Task-Entry.md`
- existing Tasks canon in `../NBOS/02-Modules/05-Tasks/`

This document is the implementation handoff. It does not override product canon.

## 1. Mandatory reading before coding

Read in this order:

1. `AGENTS.md`
2. `docs/AI-START-HERE.md`
3. `docs/TECH_CARD.md`
4. `docs/01-ARCHITECTURE.md`
5. `docs/NBOS/00-Documentation-Hub.md`
6. `docs/NBOS/00-Technical-Decisions-By-Module.md`
7. both Quick Actions canon files above
8. current Tasks canon / cleanup register
9. applicable `.cursor/rules` and `.agents/skills`

Do not run project onboarding. Before completion use the repository verification workflow. Auth/session/PWA changes require security-aware review.

---

## 2. Scope

Implement one cohesive vertical slice:

```text
NBOS Quick Actions foundation
└── /quick/task
    ├── existing QuickCreateTaskDialog opens first
    ├── existing mobile bottom sheet is reused
    ├── current user/creator bootstrap
    ├── background existing Tasks surface
    ├── create → background list sync
    ├── close → Tasks/detail/edit
    ├── dedicated install/shortcut metadata
    └── performance instrumentation + QA
```

Do **not** implement Quick Expense, Quick Note, native widgets, native mobile app or offline writes in this slice.

---

## 3. Current runtime inventory to verify first

The following paths were inspected when this plan was written. Re-read them before editing because the working branch may have moved.

### PWA / application shell

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/sw.js`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/proxy.ts`
- `apps/web/src/lib/api.ts`

Important baseline:

- main manifest currently opens `/` as standalone NBOS;
- service worker is intentionally install-only/pass-through;
- root layout resolves auth and provides SessionProvider/QueryProvider/theme/PWA registration;
- normal `(app)` layout adds PermissionProvider, Messenger persistence and full AppLayout;
- browser API uses existing BFF/session flow.

### Quick Create

- `apps/web/src/components/shared/quick-create-task/QuickCreateTaskDialog.tsx`
- `apps/web/src/components/shared/quick-create-task/use-quick-create-task-form.ts`
- `apps/web/src/features/tasks/components/QuickCreateTaskDialog.tsx`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/ui/dialog-mobile-sheet.ts`

Important baseline:

- task feature component re-exports the shared dialog;
- generic Dialog switches to the NBOS bottom sheet on mobile;
- the quick form already owns title, description, assignee, priority, due date and submit;
- do not recreate these controls.

### Tasks page / identity / synchronization

- `apps/web/src/app/(app)/tasks/page.tsx`
- `apps/web/src/features/tasks/use-tasks-list-page.ts`
- `apps/web/src/features/tasks/use-task-creator-id.ts`
- `apps/web/src/lib/permissions/PermissionContext.tsx`
- `apps/web/src/features/tasks/task-created-sync.ts`
- `apps/web/src/features/tasks/use-prepend-externally-created-task.ts`
- `apps/web/src/lib/api/tasks.ts`

Important baseline:

- current Tasks page loads list/stats/stages in its hook and owns TaskSheet + QuickCreateTaskDialog;
- task list is currently local React state, not a TanStack Query list cache;
- creator ID comes from current `/api/me` Employee;
- existing task-created browser event can prepend an externally created task to an open Tasks list;
- `tasksApi.create` already returns the created Task.

Do not replace these contracts without a demonstrated need.

---

## 4. Required architecture

### 4.1. Stable route

Add explicit authenticated route:

```text
/quick/task
```

Do not make the first implementation a generic catch-all form route. Future actions may use the same shell but retain explicit domain routes.

### 4.2. Lightweight Quick Action shell

Create the smallest shared shell needed for Quick Actions, for example conceptually:

```text
quick/
  layout / shell
  task/
```

Naming may follow existing project conventions after inspection.

The shell can own:

- auth-aware entry;
- the minimum provider(s) required by the reused domain form;
- launch lifecycle;
- background destination loading;
- install metadata selection;
- performance marks;
- shared quick-action error/fallback chrome.

Do not put task business state in the generic shell.

### 4.3. Do not put full app initialization on the critical path

The existing `(app)` layout adds `PermissionProvider`, `MessengerPersistProvider`, `AppLayout`, `ModuleAccessGate`.

Quick Task needs current Employee/permissions because the existing form uses them, but Messenger/full application chrome must not be initialized **before** the form can become usable merely to support a later background view.

Choose a composition that keeps the critical path small while preserving normal auth/RBAC. Do not bypass backend permission enforcement.

### 4.4. Reusable Tasks surface

If necessary, extract/refactor the body of the current `/tasks` page into a reusable Tasks surface instead of cloning it.

Target composition:

```text
normal /tasks
→ normal AppLayout
→ reusable Tasks surface

/quick/task
→ QuickActionShell
→ immediate QuickCreateTaskDialog
→ lazy/background reusable Tasks surface
```

The exact component names are implementation details. The invariant is one Tasks behavior, not two forks.

The normal `/tasks` route must continue to behave the same after refactor.

---

## 5. Critical-path behavior

On `/quick/task`:

1. mount/open the existing `QuickCreateTaskDialog` immediately;
2. focus Task name as the existing component does;
3. do not await Tasks list/stats/stages before rendering the form;
4. start loading the reusable Tasks surface/data after the quick form path is active;
5. background loading must not steal focus or reset the form;
6. `Cancel`/close reveals the Tasks surface;
7. if background load is still pending, show an honest lightweight Tasks loading state without reopening/losing the task form unexpectedly.

Use dynamic/lazy loading where it actually removes work from the first interaction. Do not add loading indirection that makes the form slower.

---

## 6. Identity and draft-safety fix

This is a required part of the slice, not optional polish.

At plan time `useQuickCreateTaskForm()` resets defaults when `open/applyDefaults` changes, and `applyDefaults` depends on `creatorId`, `defaultDueDate` and `me`. In a fast entry, `me` may resolve after the user has already started typing.

Implementation must guarantee:

```text
late /api/me resolution != form reset
```

Expected behavior:

- user can type title/description while creator bootstrap is pending;
- Create is disabled until valid creator ID is ready;
- when current Employee arrives, default assignee may be applied only if the user has not changed assignee;
- title, description, priority, due date and manual assignee are not replaced;
- reopening a fresh create flow still resets to clean defaults as expected.

Refactor shared quick form state carefully so ordinary NBOS callers keep their existing behavior.

Add targeted tests for this state transition.

---

## 7. Assignee loading

Do not block initial form on a full employee directory.

Keep existing server-authoritative employee search.

Optional first-slice optimization after the form is interactive:

- prefetch a small first page / recent options in memory;
- reuse results for subsequent picker openings in the same session;
- preserve search correctness and permissions.

Do not add persistent/offline full employee storage unless a separate requirement proves it necessary.

---

## 8. Background Tasks synchronization

After successful creation, the background Tasks surface should know about the new task without a hard reload.

Prefer existing mechanisms:

- `onCreated` from Quick Create;
- `TASK_CREATED_EVENT` / `dispatchTaskCreated`;
- `usePrependExternallyCreatedTask`;
- or a clean shared equivalent if the refactor naturally consolidates them.

Avoid two independent synchronization mechanisms for the same event.

Respect the current list scope/filter semantics. A task that does not belong to the current visible scope must not be forcibly rendered in a wrong view just because it was created.

Provide success feedback and an `Open`/equivalent route into the existing TaskSheet/detail flow when practical.

---

## 9. PWA / home-screen delivery

### 9.1. Keep main NBOS install unchanged

Do not change the semantics of the existing `manifest.webmanifest` start URL for the main app.

### 9.2. Add Quick Task install metadata

Add a dedicated Quick Task manifest/metadata strategy with:

- unique app identity where supported;
- name/short name clearly indicating task creation;
- `start_url: /quick/task`;
- standalone display;
- task-specific icon(s) following the existing icon quality rules;
- scope broad enough for the Quick Task → Tasks/detail flow that the product requires.

Do not invent a new brand system; use NBOS visual identity and an unambiguous task/add glyph.

### 9.3. Validate actual devices

Manual acceptance must include:

- iPhone/iOS Safari Add to Home Screen;
- Android Chrome and/or the browser used by the team (Samsung Internet if relevant);
- coexistence with the normal NBOS home-screen install where the platform supports it;
- fallback OS/home-screen shortcut to `/quick/task` if second-install semantics are limited by a browser.

Do not claim identical installation behavior across OS/browser combinations without testing.

---

## 10. Service worker and cache constraints

Preserve the current security decision:

```text
no cached authenticated HTML/RSC
no cached BFF
no cached API data
no offline mutation queue
```

Do not modify `sw.js` to cache `/quick/task` HTML or `/api/me`, `/api/tasks`, `/api/employees` responses.

If implementation introduces any explicit static precache, restrict it to identity-free immutable static assets and run security review. It is not required for the first slice.

The performance win should come primarily from:

- small quick route critical path;
- code splitting;
- browser cache of normal immutable assets;
- delayed/background Tasks work;
- no duplicated app boot work.

---

## 11. i18n

The current product is rolling out EN/RU with HY reserved/pilot. Quick Action shell strings must use the existing localization system and namespaces/registry conventions.

The reused Quick Create form must not get a separate translation copy for Quick Task.

Verify at minimum EN/RU on mobile. Preserve draft on locale-sensitive rerenders where applicable.

---

## 12. Performance instrumentation

Use `performance.mark` / `performance.measure` or the existing project telemetry abstraction if one exists and is appropriate.

Measure:

```text
quick_action_launch
quick_task_form_visible
quick_task_title_interactive
quick_task_identity_ready
quick_task_background_tasks_ready
quick_task_submit_start
quick_task_submit_success | quick_task_submit_failure
```

No task title, description, employee query or other business content in telemetry.

Before optimization claims, record baseline and post-change measurements on representative devices.

Initial target, not hard SLA:

- warm: title interactive ideally under 300 ms;
- cold: title interactive ideally under 1 s on agreed device/network;
- Tasks background work never blocks typing.

If the target is not met, report actual measurements and bottleneck rather than hiding it.

---

## 13. Tests and validation

Inspect current package scripts first. Use repository-real commands only.

### Required targeted behavior tests

At minimum cover:

1. Quick route requires normal authentication and preserves callback route.
2. Existing shared Quick Create component is used; no quick-only form copy.
3. Phone viewport receives standard mobile bottom-sheet behavior.
4. Form is open before Tasks background load resolves.
5. User types before `me` resolves → draft survives identity arrival.
6. Create cannot submit without valid creator ID.
7. Default assignee becomes current Employee when untouched.
8. Manual assignee selection survives later background/default updates.
9. Employee search error does not clear draft.
10. Successful create updates the background Tasks surface without full reload.
11. Closing form exposes Tasks; existing TaskSheet/detail can open.
12. Failed Tasks background load does not block task create when create dependencies are ready.
13. Failed create preserves usable draft and existing error feedback.
14. Main NBOS manifest/install behavior is unchanged.
15. Quick Task manifest starts at `/quick/task` and does not weaken service-worker cache policy.

### Regression validation

Run applicable current commands such as, after verifying package scripts:

```text
pnpm --filter @nbos/web typecheck
pnpm --filter @nbos/web lint
pnpm exec vitest run <targeted verified paths>
pnpm run build:web
```

Run auth/security regression tests affected by route/layout/session changes.

No production deployment or production migration is part of this slice.

---

## 14. Manual QA matrix

Test at least:

| Case | Expected |
| --- | --- |
| warm launch | form first, title focused |
| cold launch | form becomes usable before full Tasks |
| slow network | draft usable; background honest loading |
| expired session | normal sign-in/recovery; callback returns to Quick Task |
| current-user task | creator/current assignee correct |
| assign colleague | search/select/create works |
| type before identity | no draft reset |
| close without create | Tasks surface available/loading honestly |
| create then open | created Task opens existing detail/edit |
| create then close | task appears when in visible scope |
| iOS install/shortcut | opens `/quick/task` |
| Android install/shortcut | opens `/quick/task` |
| main NBOS icon | still opens normal NBOS |

Capture launch timings for warm/cold runs.

---

## 15. Documentation completion after code

Only after verified implementation:

- update `docs/IMPLEMENTATION_PROGRESS.md`;
- update Tasks cleanup/runtime status where the gap is closed;
- move a completed slice to `IMPLEMENTATION_DONE.md` only with real evidence;
- update this plan status and list exact checks/results;
- document any browser-specific install limitation discovered during live QA.

Do not rewrite approved product canon to match an accidental implementation shortcut. If implementation proves a canon constraint infeasible, stop and surface the conflict.

---

## 16. Definition of Done

The slice is done only when:

- `/quick/task` exists and is auth-safe;
- current shared Quick Create is the single form implementation;
- current mobile bottom sheet is reused;
- form interaction is not gated by task-list loading;
- late identity/bootstrap cannot wipe draft;
- creator/assignee semantics match canon;
- Tasks loads in background and is accessible after close;
- created task synchronizes into the existing Tasks behavior;
- dedicated Quick Task install/shortcut flow is tested on target iOS/Android;
- main NBOS PWA has no regression;
- service worker still does not cache authenticated dynamic data;
- targeted tests, typecheck/lint and relevant build/security checks are reported;
- performance measurements are reported, not assumed;
- implementation status docs are updated to actual results.
