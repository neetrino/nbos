'use client';

import { useCallback, useEffect, useState } from 'react';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { buildEntityLinkedTasksQuery } from '../utils/crm-entity-task-links';

export function useEntityLinkedTasks(
  entityType: string,
  entityId: string,
  refreshSignal = 0,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getAll(buildEntityLinkedTasksQuery(entityType, entityId));
      setTasks(data.items);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  // Parent create dialogs already call onRefresh once. Do not also call it here —
  // an inline onRefresh that reloads the CRM board would retrigger this effect.
  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks, refreshSignal]);

  return { tasks, loading, fetchTasks };
}
