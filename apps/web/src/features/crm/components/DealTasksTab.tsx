'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickCreateTaskDialog, StatusBadge } from '@/components/shared';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { getTaskStatus } from '@/features/tasks/constants/tasks';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import type { Deal } from '@/lib/api/deals';

interface DealTasksTabProps {
  deal: Deal;
  onRefresh?: () => void;
}

export function DealTasksTab({ deal, onRefresh }: DealTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { creatorId, creatorReady } = useTaskCreatorId();

  const projectId = deal.projectId ?? deal.orders?.[0]?.projectId;
  const defaultLinks = useMemo(
    () =>
      projectId
        ? [
            { entityType: 'DEAL', entityId: deal.id },
            { entityType: 'PROJECT', entityId: projectId },
          ]
        : undefined,
    [deal.id, projectId],
  );

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await tasksApi.getAll({
        entityType: 'PROJECT',
        entityId: projectId,
        pageSize: 50,
      });
      setTasks(data.items);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/40">
          <CheckSquare size={24} className="text-stone-400" />
        </div>
        <h3 className="text-foreground mb-1.5 text-sm font-semibold">Tasks</h3>
        <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
          Link a project to this deal to create and view tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:border-sky-800 dark:text-sky-400"
        disabled={creatorReady && !creatorId}
        title={creatorReady && !creatorId ? 'Employee profile required' : undefined}
        onClick={() => setQuickCreateOpen(true)}
      >
        <Plus size={14} />
        Create Task
      </Button>

      <QuickCreateTaskDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultLinks={defaultLinks}
        onCreated={() => {
          void fetchTasks();
          onRefresh?.();
        }}
      />

      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">Loading tasks...</div>
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusInfo = getTaskStatus(task.status);
            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl border border-stone-100 p-4 transition-colors hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">{task.title}</p>
                    {statusInfo ? (
                      <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
                    ) : null}
                  </div>
                </div>
                {task.dueDate ? (
                  <span className="text-muted-foreground text-xs">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/40">
            <CheckSquare size={24} className="text-stone-400" />
          </div>
          <h3 className="text-foreground mb-1.5 text-sm font-semibold">Tasks</h3>
          <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
            No tasks yet. Create one to track work for this deal.
          </p>
        </div>
      )}
    </div>
  );
}
