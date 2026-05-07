'use client';

import { useState, useEffect, useCallback } from 'react';
import { tasksApi, type Task, type WorkSpace } from '@/lib/api/tasks';
import { WorkSpaceRuntime } from '@/features/tasks/work-spaces/WorkSpaceRuntime';
import { buildDefaultTaskLink } from '@/features/tasks/work-spaces/work-space-utils';
import { ProductWorkSpaceHeader } from './ProductWorkSpaceHeader';

interface ProductTasksTabProps {
  productId: string;
}

export function ProductTasksTab({ productId }: ProductTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspace, setWorkspace] = useState<WorkSpace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkSpaceTasks = useCallback(async () => {
    setLoading(true);
    try {
      const productWorkspace = await tasksApi.ensureProductWorkSpace(productId);
      const [workspaceTasks, linkedTasks] = await Promise.all([
        tasksApi.getAll({ workspaceId: productWorkspace.id, pageSize: 100 }),
        tasksApi.getByEntity('PRODUCT', productId),
      ]);
      setWorkspace(productWorkspace);
      setTasks(mergeTasks(workspaceTasks.items, linkedTasks));
    } catch {
      setWorkspace(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchWorkSpaceTasks();
  }, [fetchWorkSpaceTasks]);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading Work Space...</div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Work Space could not be loaded.
      </div>
    );
  }

  const defaultLink = buildDefaultTaskLink(workspace);

  return (
    <div className="space-y-4">
      <ProductWorkSpaceHeader workspace={workspace} tasks={tasks} />
      <WorkSpaceRuntime
        workspace={workspace}
        tasks={tasks}
        setTasks={setTasks}
        onRefresh={fetchWorkSpaceTasks}
        mode="embedded"
        defaultTaskLink={defaultLink ?? undefined}
      />
    </div>
  );
}

function mergeTasks(primary: Task[], secondary: Task[]): Task[] {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((task) => {
    if (seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}
