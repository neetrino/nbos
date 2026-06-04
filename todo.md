# Task Management — Improvement Plan (A + B + C + DRY + Tests)

Goal: fix real task-board pains. Bite pain, not "rewrite for taste".

Legend: `[x]` done · `[ ]` todo

---

## Phase A — Persist task order on drag

- [x] **A1** — `PATCH /api/tasks/reorder` + `task-reorder.op.ts`
- [x] **A2** — `tasksApi.reorder()` in web client
- [x] **A3** — Column builders sort by `workspaceSortOrder` / `myPlanSortOrder`
- [x] **A4** — Persist reorder via `persistColumnTaskReorder` in shared hook
- [x] **A5** — Tests: `task-reorder.op.test.ts`, `persist-column-task-reorder.test.ts`

## Phase DRY — Unified board logic

- [x] **D1** — `useTaskBoardMutations` (`task-board/use-task-board-mutations.ts`)
- [x] **D2** — `use-workspace-runtime-board.ts` + `use-tasks-list-page.ts` refactored
- [x] **D3** — Tests: `sort-tasks-by-board-order.test.ts`, reorder persist test

## Phase B — Pagination / silent task loss

- [x] **B1** — `TASK_LIST_PAGE_SIZE` / `TASK_LIST_GLOBAL_PAGE_SIZE` constants (web + API)
- [x] **B2** — API clamp in `task-list-pagination.ts` + sort fields for board order
- [x] **B3** — `TaskListLoadMoreBanner` on `/tasks`, Work Space detail, product tab
- [x] **B4** — Product tab: bounded linked fetch via `getAll` + shared `work-space-task-fetch.ts`
- [x] **B5** — `task-list-pagination.test.ts`

## Phase C — Cleanup

- [ ] **C1** — Rename `workspace-runtime-filter-bar.tsx` (deferred — import churn, no user impact)
- [x] **C2** — `work-spaces.service.findById` no longer embeds `take: 50` tasks
- [x] **C3** — Removed deprecated `ProductWorkSpaceTabData` alias

## Out of scope (separate epic)

- Full TanStack Query migration for global `/tasks`
- Splitting god-files (`tasks.service.ts`, `use-task-sheet-state.ts`)

## Verification

- [x] `pnpm exec vitest run` on new test files (31 passed)
- [ ] Manual: drag reorder → refresh → order kept; Load more when >100 tasks
