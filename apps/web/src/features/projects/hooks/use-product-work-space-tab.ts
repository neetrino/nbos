'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task, WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  fetchMoreWorkSpaceTabTasks,
  fetchProductWorkSpaceTabData,
  invalidateWorkSpaceTaskQueries,
  productWorkSpaceQueryKeys,
  type TaskListMeta,
  type WorkSpaceTabData,
} from '@/features/tasks/work-spaces/work-space-queries';

export type UseProductWorkSpaceTabResult = {
  workspace: WorkSpace | null;
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  sprints: WorkSpaceSprint[];
  setSprints: Dispatch<SetStateAction<WorkSpaceSprint[]>>;
  taskMeta: TaskListMeta | null;
  loading: boolean;
  loadingMoreTasks: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshTasksFromServer: () => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  handleWorkspaceUpdate: (updated: WorkSpace) => Promise<void>;
};

/**
 * Product Work Space tab — TanStack Query cache keyed by productId.
 * Fetch runs when `loadRequested` is true (Work Space tab active); cache survives tab switches.
 */
export function useProductWorkSpaceTab(
  productId: string,
  loadRequested: boolean,
  knownWorkSpaceId?: string | null,
): UseProductWorkSpaceTabResult {
  const queryClient = useQueryClient();
  const queryKey = productWorkSpaceQueryKeys.tab(productId);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchProductWorkSpaceTabData(productId, knownWorkSpaceId),
    enabled: loadRequested && Boolean(productId),
  });

  const data = query.data;
  const workspace = data?.workspace ?? null;

  const patchTabData = useCallback(
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
      productId: workspace.productId ?? productId,
    });
    await queryClient.refetchQueries({ queryKey });
  }, [queryClient, queryKey, workspace, productId]);

  const handleWorkspaceUpdate = useCallback(
    async (updated: WorkSpace) => {
      if (updated.scrumEnabled) {
        const nextSprints = await workSpaceSprintsApi.list(updated.id).catch(() => []);
        patchTabData({ workspace: updated, sprints: nextSprints });
        return;
      }
      patchTabData({ workspace: updated, sprints: [] });
    },
    [patchTabData],
  );

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const loadMoreTasks = useCallback(async () => {
    if (!data?.taskMeta || data.taskMeta.page >= data.taskMeta.totalPages) return;
    setLoadingMoreTasks(true);
    try {
      const next = await fetchMoreWorkSpaceTabTasks(data);
      patchTabData(next);
    } finally {
      setLoadingMoreTasks(false);
    }
  }, [data, patchTabData]);

  const error = query.error
    ? getApiErrorMessage(query.error, 'Work Space could not be loaded.')
    : null;

  return {
    workspace,
    tasks: data?.tasks ?? [],
    setTasks,
    sprints: data?.sprints ?? [],
    setSprints,
    taskMeta: data?.taskMeta ?? null,
    loading: query.isLoading && !data,
    loadingMoreTasks,
    error,
    refetch,
    refreshTasksFromServer,
    loadMoreTasks,
    handleWorkspaceUpdate,
  };
}
