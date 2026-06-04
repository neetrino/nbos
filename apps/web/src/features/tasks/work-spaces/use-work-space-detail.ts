'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task, WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  fetchWorkSpaceDetailData,
  invalidateWorkSpaceTaskQueries,
  workSpaceQueryKeys,
  type WorkSpaceTabData,
} from '@/features/tasks/work-spaces/work-space-queries';

export type UseWorkSpaceDetailResult = {
  workspace: WorkSpace | null;
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  sprints: WorkSpaceSprint[];
  setSprints: Dispatch<SetStateAction<WorkSpaceSprint[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshTasksFromServer: () => Promise<void>;
  handleWorkspaceUpdate: (updated: WorkSpace) => Promise<void>;
};

export function useWorkSpaceDetail(workspaceId: string): UseWorkSpaceDetailResult {
  const queryClient = useQueryClient();
  const queryKey = workSpaceQueryKeys.detail(workspaceId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchWorkSpaceDetailData(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const data = query.data;
  const workspace = data?.workspace ?? null;

  const patchDetailData = useCallback(
    (patch: Partial<WorkSpaceTabData>) => {
      queryClient.setQueryData<WorkSpaceTabData>(queryKey, (current) => {
        if (!current) return current;
        return { ...current, ...patch };
      });
    },
    [queryClient, queryKey],
  );

  const setTasks = useCallback<Dispatch<SetStateAction<Task[]>>>(
    (updater) => {
      queryClient.setQueryData<WorkSpaceTabData>(queryKey, (current) => {
        if (!current) return current;
        const nextTasks = typeof updater === 'function' ? updater(current.tasks) : updater;
        return { ...current, tasks: nextTasks };
      });
    },
    [queryClient, queryKey],
  );

  const setSprints = useCallback<Dispatch<SetStateAction<WorkSpaceSprint[]>>>(
    (updater) => {
      queryClient.setQueryData<WorkSpaceTabData>(queryKey, (current) => {
        if (!current) return current;
        const nextSprints = typeof updater === 'function' ? updater(current.sprints) : updater;
        return { ...current, sprints: nextSprints };
      });
    },
    [queryClient, queryKey],
  );

  const refreshTasksFromServer = useCallback(async () => {
    if (!workspace) return;
    invalidateWorkSpaceTaskQueries(queryClient, {
      workspaceId: workspace.id,
      productId: workspace.productId,
    });
    await queryClient.refetchQueries({ queryKey });
  }, [queryClient, queryKey, workspace]);

  const handleWorkspaceUpdate = useCallback(
    async (updated: WorkSpace) => {
      if (updated.scrumEnabled) {
        const nextSprints = await workSpaceSprintsApi.list(updated.id).catch(() => []);
        patchDetailData({ workspace: updated, sprints: nextSprints });
        return;
      }
      patchDetailData({ workspace: updated, sprints: [] });
    },
    [patchDetailData],
  );

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const error = query.error
    ? getApiErrorMessage(query.error, 'Work Space could not be loaded.')
    : null;

  return {
    workspace,
    tasks: data?.tasks ?? [],
    setTasks,
    sprints: data?.sprints ?? [],
    setSprints,
    loading: query.isLoading && !data,
    error,
    refetch,
    refreshTasksFromServer,
    handleWorkspaceUpdate,
  };
}
