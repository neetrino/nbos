'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { getTaskStatus } from '@/features/tasks/constants/tasks';
import type { Deal } from '@/lib/api/deals';

interface DealTasksTabProps {
  deal: Deal;
  onRefresh?: () => void;
}

export function DealTasksTab({ deal, onRefresh }: DealTasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const projectId = deal.projectId ?? deal.orders?.[0]?.projectId;

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await tasksApi.getAll({ projectId, pageSize: 50 });
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

  const handleCreate = async () => {
    const title = taskTitle.trim();
    if (!title || !projectId || !deal.seller?.id) return;

    setCreating(true);
    try {
      await tasksApi.create({
        title,
        projectId,
        creatorId: deal.seller.id,
        description: `Deal: ${deal.code} — ${deal.name ?? ''}`.trim(),
      });
      setShowForm(false);
      setTaskTitle('');
      fetchTasks();
      onRefresh?.();
    } finally {
      setCreating(false);
    }
  };

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
      {projectId && (
        <div>
          {showForm ? (
            <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-950/20">
              <div className="flex-1">
                <label className="text-muted-foreground mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                  Task title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 dark:border-stone-700 dark:bg-stone-900"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setShowForm(false);
                  }}
                />
              </div>
              <div className="flex gap-1.5 pt-5">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || !taskTitle.trim()}
                  className="gap-1"
                >
                  <Check size={14} />
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setTaskTitle('');
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:border-sky-800 dark:text-sky-400"
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} />
              Create Task
            </Button>
          )}
        </div>
      )}

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
                    {statusInfo && (
                      <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
                    )}
                  </div>
                </div>
                {task.dueDate && (
                  <span className="text-muted-foreground text-xs">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/40">
              <CheckSquare size={24} className="text-stone-400" />
            </div>
            <h3 className="text-foreground mb-1.5 text-sm font-semibold">Tasks</h3>
            <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
              No tasks yet. Create one to track work for this deal.
            </p>
          </div>
        )
      )}
    </div>
  );
}
