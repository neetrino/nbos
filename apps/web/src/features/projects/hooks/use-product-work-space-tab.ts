'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task, WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  fetchProductWorkSpaceTabData,
  productWorkSpaceQueryKeys,
  type ProductWorkSpaceTabData,
} from '@/features/tasks/work-spaces/product-work-space-queries';

export type UseProductWorkSpaceTabResult = {
  workspace: WorkSpace | null;
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  sprints: WorkSpaceSprint[];
  setSprints: Dispatch<SetStateAction<WorkSpaceSprint[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  handleWorkspaceUpdate: (updated: WorkSpace) => Promise<void>;
};

/**
 * Product Work Space tab — TanStack Query cache keyed by productId.
 * Fetch runs when `loadRequested` is true (Work Space tab active); cache survives tab switches.
 */
export function useProductWorkSpaceTab(
  productId: string,
  loadRequested: boolean,
): UseProductWorkSpaceTabResult {
  const queryClient = useQueryClient();
  const queryKey = productWorkSpaceQueryKeys.tab(productId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchProductWorkSpaceTabData(productId),
    enabled: loadRequested && Boolean(productId),
  });

  const data = query.data;
  const workspace = data?.workspace ?? null;
  const tasks = data?.tasks ?? [];
  const sprints = data?.sprints ?? [];

  const patchTabData = useCallback(
    (patch: Partial<ProductWorkSpaceTabData>) => {
      queryClient.setQueryData<ProductWorkSpaceTabData>(queryKey, (current) => {
        if (!current) return current;
        return { ...current, ...patch };
      });
    },
    [queryClient, queryKey],
  );

  const setTasks = useCallback<Dispatch<SetStateAction<Task[]>>>(
    (updater) => {
      queryClient.setQueryData<ProductWorkSpaceTabData>(queryKey, (current) => {
        if (!current) return current;
        const nextTasks = typeof updater === 'function' ? updater(current.tasks) : updater;
        return { ...current, tasks: nextTasks };
      });
    },
    [queryClient, queryKey],
  );

  const setSprints = useCallback<Dispatch<SetStateAction<WorkSpaceSprint[]>>>(
    (updater) => {
      queryClient.setQueryData<ProductWorkSpaceTabData>(queryKey, (current) => {
        if (!current) return current;
        const nextSprints = typeof updater === 'function' ? updater(current.sprints) : updater;
        return { ...current, sprints: nextSprints };
      });
    },
    [queryClient, queryKey],
  );

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

  const error = query.error
    ? getApiErrorMessage(query.error, 'Work Space could not be loaded.')
    : null;

  return {
    workspace,
    tasks,
    setTasks,
    sprints,
    setSprints,
    loading: query.isLoading && !data,
    error,
    refetch,
    handleWorkspaceUpdate,
  };
}
