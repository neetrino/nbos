'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, List, AlertTriangle, Play, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { getTaskStatus, getTaskPriority } from '@/features/tasks/constants/tasks';

interface ProductTasksTabProps {
  productId: string;
}

const KANBAN_COLUMNS = ['NEW', 'IN_PROGRESS', 'DONE', 'DEFERRED'];

export function ProductTasksTab({ productId }: ProductTasksTabProps) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getByEntity('PRODUCT', productId);
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAction = async (taskId: string, action: 'start' | 'complete' | 'reopen') => {
    try {
      const updated = await tasksApi[action](taskId);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      /* handled by API layer */
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'CANCELLED');
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const totalActive = activeTasks.length;

  if (loading) {
    return <div className="text-muted-foreground py-12 text-center text-sm">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        No tasks linked to this product yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {doneTasks}/{totalActive} completed
          </span>
          <div className="bg-secondary h-2 w-32 rounded-full">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${totalActive > 0 ? (doneTasks / totalActive) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('kanban')}
            className="rounded-r-none"
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-l-none"
          >
            <List size={14} />
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
            const st = getTaskStatus(col);
            return (
              <div key={col} className="bg-muted/30 min-w-[220px] flex-1 rounded-xl p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: st?.color?.replace('bg-', '') ?? '#888' }}
                    />
                    <span className="text-xs font-semibold">{st?.label ?? col}</span>
                  </div>
                  <span className="bg-muted rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const pr = getTaskPriority(task.priority);
                    return (
                      <div key={task.id} className="bg-card border-border rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs leading-tight font-medium">{task.title}</p>
                          {task.priority === 'CRITICAL' && (
                            <AlertTriangle size={12} className="shrink-0 text-red-500" />
                          )}
                        </div>
                        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-[10px]">
                          <span>{task.code}</span>
                          {pr && <StatusBadge label={pr.label} variant={pr.variant} />}
                        </div>
                        {task.assignee && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                              {task.assignee.firstName[0]}
                              {task.assignee.lastName[0]}
                            </div>
                            <span className="text-muted-foreground text-[10px]">
                              {task.assignee.firstName}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          {task.status === 'NEW' && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleAction(task.id, 'start')}
                              title="Start"
                            >
                              <Play size={10} />
                            </Button>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleAction(task.id, 'complete')}
                              title="Complete"
                            >
                              <Check size={10} />
                            </Button>
                          )}
                          {task.status === 'DONE' && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleAction(task.id, 'reopen')}
                              title="Reopen"
                            >
                              <RotateCcw size={10} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Task</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Priority</th>
                <th className="px-4 py-2 text-left font-medium">Assignee</th>
                <th className="px-4 py-2 text-left font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {activeTasks.map((task) => {
                const st = getTaskStatus(task.status);
                const pr = getTaskPriority(task.priority);
                return (
                  <tr key={task.id} className="border-border border-t">
                    <td className="px-4 py-2">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-muted-foreground text-xs">{task.code}</p>
                    </td>
                    <td className="px-4 py-2">
                      {st && <StatusBadge label={st.label} variant={st.variant} />}
                    </td>
                    <td className="px-4 py-2">
                      {pr && <StatusBadge label={pr.label} variant={pr.variant} />}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {task.assignee
                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                        : '\u2014'}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '\u2014'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
