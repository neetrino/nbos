# Task Management — Improvement Plan (A + B + C + DRY + Tests)

Goal: fix real task-board pains found in audit. Bite pain, not "rewrite for taste".
Source audit confirmed in code (see file refs per task).

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase A — Persist task order on drag (REAL BUG, high value, low risk)

Problem: kanban/my-plan/deadline reorder updates only local array; `workspaceSortOrder` /
`myPlanSortOrder` exist on API (`tasks.controller.ts` L151-154, `tasks.service.ts` L220-231)
but are never sent. Order is lost on refresh.
Reorder handlers (client-only): `use-workspace-runtime-board.ts` L142-173,
`use-tasks-list-page.ts` L191-213. UI primitive: `KanbanBoard` `onReorderWithinColumn(itemId, columnKey, toIndex)`.

- [ ] **A1. Backend batch reorder endpoint** — mirror existing `PATCH /task-boards/stages/reorder`.
      `PATCH /api/tasks/reorder` body `{ taskIds: string[]; scope: 'workspace' | 'my-plan' }`.
      Service sets sequential `workspaceSortOrder` / `myPlanSortOrder` in one transaction.
      File: `apps/api/src/modules/tasks/tasks.controller.ts` + new op
      `task-reorder.op.ts` + `tasks.service.ts`. RBAC: `TASKS EDIT`.
- [ ] **A2. Web API client** — `tasksApi.reorder(taskIds, scope)` in `apps/web/src/lib/api/tasks.ts`.
- [ ] **A3. Board fetch ordering** — ensure board reads persisted order:
      column builders sort by `workspaceSortOrder` / `myPlanSortOrder` (fallback `createdAt`).
      Files: `task-board/workspace-kanban.ts`, `my-plan-columns.ts`, builders consumed in board hook.
- [ ] **A4. Wire reorder handlers** — optimistic local reorder + persist via `tasksApi.reorder`
      (debounced/awaited), rollback on error. Update BOTH hooks
      (`use-workspace-runtime-board.ts`, `use-tasks-list-page.ts`) — or single shared hook from Phase DRY.
- [ ] **A5. Tests** — op unit test (sequential order assignment, scope switch),
      web unit test for reorder→payload mapping.

Note: implement A4 AFTER DRY if doing full scope, to avoid editing duplicated handlers twice.

---

## Phase B — Remove silent task loss (`pageSize` caps) (high value, low/med risk)

Problem: hardcoded `pageSize: 100` (workspace/product) and `200` (global) with no
"has more" / total. Large workspaces silently miss tasks. API task list has no max clamp.
Refs: `work-space-queries.ts` L67,L79; `WorkspaceScrumPlanner.tsx` L97,~L227;
`use-tasks-list-page.ts` L105; API `task-find-all-paginated.op.ts` L67 (default 20, no max).

- [ ] **B1. Shared constant** — `TASK_LIST_PAGE_SIZE` + `TASK_LIST_MAX_PAGE_SIZE` in a tasks constants file;
      replace magic 100/200/50 across web fetches.
- [ ] **B2. API clamp** — clamp `pageSize` to max in `task-find-all-paginated.op.ts`
      (mirror work-spaces clamp). Return accurate `meta.total`.
- [ ] **B3. Surface truncation** — when `meta.total > items.length`, show count/"Load more"
      (or raise cap + banner) on workspace runtime + global list. Decide UX:
      simplest = fetch by `meta.total`-aware "Load more"; do NOT block release on infinite scroll.
- [ ] **B4. Product tab double-fetch** — `fetchProductWorkSpaceTabData` loads workspace tasks +
      unbounded `getByEntity('PRODUCT')` then merges (`work-space-queries.ts` L66-70).
      Bound the linked fetch + dedupe count; document why both are needed.
- [ ] **B5. Tests** — API clamp test; merge/dedupe count test (extend `work-space-utils.test.ts`).

---

## Phase DRY — Unify duplicated board logic (med value, med risk)

Problem: `use-tasks-list-page.ts` (~420) and `use-workspace-runtime-board.ts` (~380) share
near-identical move/reorder/create handlers → drift risk.

- [ ] **D1. Extract `useTaskBoardMutations`** — shared hook owning move/reorder/create/quick-create
      against `(tasks, setTasks)` + injected board view. Keep page-specific glue thin.
      New file: `apps/web/src/features/tasks/task-board/use-task-board-mutations.ts`.
- [ ] **D2. Refactor both consumers** to use it; remove duplicated handlers.
      Keep file sizes within 300-line rule (split if needed).
- [ ] **D3. Tests** — unit tests for the shared hook (move status mapping, reorder payload,
      optimistic rollback). First board-hook tests in repo (coverage gap from audit).

---

## Phase C — Cohesion / cleanup (low risk, do last)

- [ ] **C1. Rename** `workspace-runtime-filter-bar.tsx` (filename no longer matches contents).
- [ ] **C2. `work-spaces.service.findById`** — drop or document embedded `take: 50` tasks
      (web does not use it; confusing shape) `work-spaces.service.ts` L123.
- [ ] **C3. Remove `@deprecated ProductWorkSpaceTabData` alias** once no imports remain
      (`work-space-queries.ts` L13).

---

## Out of scope (separate epic — taste, not pain)

- Full TanStack Query + `useMutation` migration for global `/tasks`, directory, deal tab.
- Splitting god-files (`tasks.service.ts` 527, `use-task-sheet-state.ts` 473).
- Cursor/infinite-scroll pagination (B uses "Load more" / raised cap instead).

---

## Execution order (recommended)

1. A1 → A2 → A3 (backend + client + ordering, independently shippable)
2. DRY D1 → D2 (so reorder wiring touches ONE hook)
3. A4 → A5 (wire + test reorder)
4. B1 → B2 → B3 → B4 → B5
5. C1 → C2 → C3
6. Full typecheck + vitest + manual QA, then push/PR

## Verification per phase

- `pnpm exec vitest run <changed test files>` from repo root.
- Manual: drag reorder → refresh → order kept; workspace with >cap tasks shows all/load-more;
  global `/tasks` + product tab + standalone unaffected.
