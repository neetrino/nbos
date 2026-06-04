'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import {
  mergeProductWorkSpaceTasks,
  resolveProductWorkSpace,
} from '@/features/tasks/work-spaces/work-space-utils';

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
 * Product Work Space tab data — state lives in the product page so tab unmount does not refetch.
 * `loadRequested` should be true only while the Work Space tab is active (lazy load, cached in parent).
 */
export function useProductWorkSpaceTab(
  productId: string,
  loadRequested: boolean,
): UseProductWorkSpaceTabResult {
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<WorkSpaceSprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);

  useEffect(() => {
    setWorkspace(null);
    setTasks([]);
    setSprints([]);
    setError(null);
    setLoadedProductId(null);
    setLoading(false);
  }, [productId]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const productWorkspace = await resolveProductWorkSpace(productId);
      const [workspaceTasks, linkedTasks] = await Promise.all([
        tasksApi.getAll({ workspaceId: productWorkspace.id, pageSize: 100 }),
        tasksApi.getByEntity('PRODUCT', productId),
      ]);
      const mergedTasks = mergeProductWorkSpaceTasks(workspaceTasks.items, linkedTasks);
      const nextSprints = productWorkspace.scrumEnabled
        ? await workSpaceSprintsApi.list(productWorkspace.id)
        : [];

      setWorkspace(productWorkspace);
      setTasks(mergedTasks);
      setSprints(nextSprints);
      setLoadedProductId(productId);
      setError(null);
    } catch {
      setWorkspace(null);
      setTasks([]);
      setSprints([]);
      setLoadedProductId(null);
      setError('Work Space could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!loadRequested) return;
    if (loadedProductId === productId && workspace) return;
    void refetch();
  }, [loadRequested, loadedProductId, productId, workspace, refetch]);

  const handleWorkspaceUpdate = useCallback(async (updated: WorkSpace) => {
    setWorkspace(updated);
    if (updated.scrumEnabled) {
      setSprints(await workSpaceSprintsApi.list(updated.id).catch(() => []));
      return;
    }
    setSprints([]);
  }, []);

  return {
    workspace,
    tasks,
    setTasks,
    sprints,
    setSprints,
    loading,
    error,
    refetch,
    handleWorkspaceUpdate,
  };
}
