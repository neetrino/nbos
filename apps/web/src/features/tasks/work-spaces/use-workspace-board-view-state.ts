'use client';

import { useCallback, useState, type SetStateAction } from 'react';
import {
  parseTasksBoardView,
  useTasksBoardViewMode,
  type TasksPersistedBoardView,
} from '@/features/tasks/constants/tasks-board-view-storage';
import type { WorkspaceBoardView } from './use-workspace-runtime-board';
import type { WorkspaceArea } from './workspace-area';
import { WORKSPACE_AREA_ACTIVE, WORKSPACE_AREA_PLANNING } from './workspace-area';

export type WorkspaceBoardViewChange =
  | { kind: 'planning' }
  | { kind: 'view'; value: TasksPersistedBoardView };

/** Maps a view-switch action to Planning area or a persistable board mode. */
export function resolveWorkspaceBoardViewChange(
  current: TasksPersistedBoardView,
  next: SetStateAction<WorkspaceBoardView>,
): WorkspaceBoardViewChange {
  const resolved = typeof next === 'function' ? next(current) : next;
  if (resolved === 'planning') {
    return { kind: 'planning' };
  }
  return { kind: 'view', value: parseTasksBoardView(resolved) };
}

/** Persisted board mode plus local Active/Planning area for workspace hosts. */
export function useWorkspaceBoardViewState() {
  const [boardView, persistBoardView] = useTasksBoardViewMode();
  const [workspaceArea, setWorkspaceArea] = useState<WorkspaceArea>(WORKSPACE_AREA_ACTIVE);

  const handleBoardViewChange = useCallback(
    (next: SetStateAction<WorkspaceBoardView>) => {
      const change = resolveWorkspaceBoardViewChange(boardView, next);
      if (change.kind === 'planning') {
        setWorkspaceArea(WORKSPACE_AREA_PLANNING);
        return;
      }
      persistBoardView(change.value);
    },
    [boardView, persistBoardView],
  );

  return { boardView, handleBoardViewChange, workspaceArea, setWorkspaceArea };
}
