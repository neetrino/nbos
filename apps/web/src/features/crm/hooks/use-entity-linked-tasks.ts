'use client';

import { useCallback, useEffect, useState } from 'react';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { buildEntityLinkedTasksQuery } from '../utils/crm-entity-task-links';

export function useEntityLinkedTasks(entityType: string, entityId: string) {
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

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, fetchTasks };
}
