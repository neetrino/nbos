'use client';

import { createPersistedScalarStore } from '@/lib/persisted-client-state';

/** User-selectable task board modes (Planning is a workspace area, not a persisted view). */
export type TasksPersistedBoardView = 'deadline' | 'my-plan' | 'kanban' | 'list';

export const TASKS_BOARD_VIEW_STORAGE_KEY = 'nbos:tasks:board-view';
export const DEFAULT_TASKS_BOARD_VIEW: TasksPersistedBoardView = 'kanban';

const PERSISTED_TASKS_BOARD_VIEWS = new Set<string>(['deadline', 'my-plan', 'kanban', 'list']);

export function parseTasksBoardView(raw: string | null): TasksPersistedBoardView {
  if (raw && PERSISTED_TASKS_BOARD_VIEWS.has(raw)) {
    return raw as TasksPersistedBoardView;
  }
  return DEFAULT_TASKS_BOARD_VIEW;
}

const tasksBoardViewStore = createPersistedScalarStore<TasksPersistedBoardView>({
  storageKey: TASKS_BOARD_VIEW_STORAGE_KEY,
  defaultValue: DEFAULT_TASKS_BOARD_VIEW,
  changeEvent: 'nbos:tasks:board-view-change',
  parse: parseTasksBoardView,
});

export const readTasksBoardViewMode = tasksBoardViewStore.read;
export const writeTasksBoardViewMode = tasksBoardViewStore.write;
export const useTasksBoardViewMode = tasksBoardViewStore.useValue;
