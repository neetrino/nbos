'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi, type Task } from '@/lib/api/tasks';
import {
  buildDeliveryWorkSpaceTasksQuery,
  formatDeliveryWorkSpaceActiveCount,
  selectDeliveryWorkSpaceActiveTasks,
  selectDeliveryWorkSpacePreview,
} from './delivery-work-space-hub';

export function useDeliveryWorkSpaceHub(productId: string | null, enabled: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHub = useCallback(async () => {
    if (!productId || !enabled) {
      setTasks([]);
      setWorkspaceId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [list, workspace] = await Promise.all([
        tasksApi.getAll(buildDeliveryWorkSpaceTasksQuery(productId)),
        tasksApi.ensureProductWorkSpace(productId),
      ]);
      setTasks(list.items);
      setWorkspaceId(workspace.id);
    } catch {
      setTasks([]);
      setWorkspaceId(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, productId]);

  useEffect(() => {
    void fetchHub();
  }, [fetchHub]);

  const preview = useMemo(() => selectDeliveryWorkSpacePreview(tasks), [tasks]);
  const activeCountLabel = useMemo(() => {
    const active = selectDeliveryWorkSpaceActiveTasks(tasks);
    return formatDeliveryWorkSpaceActiveCount(active.length, tasks.length);
  }, [tasks]);

  return { preview, activeCountLabel, loading, workspaceId, refetch: fetchHub };
}
