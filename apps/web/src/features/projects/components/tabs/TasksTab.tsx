'use client';

import { useState } from 'react';
import { LayoutGrid, List, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { ProjectTask } from '@/lib/api/projects';

interface TasksTabProps {
  tasks: ProjectTask[];
}

const TASK_STATUS_MAP: Record<
  string,
  { label: string; variant: 'gray' | 'blue' | 'purple' | 'amber' | 'green' | 'red' }
> = {
  BACKLOG: { label: 'Backlog', variant: 'gray' },
  TODO: { label: 'To Do', variant: 'blue' },
  IN_PROGRESS: { label: 'In Progress', variant: 'purple' },
  REVIEW: { label: 'Review', variant: 'amber' },
  DONE: { label: 'Done', variant: 'green' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
};

const PRIORITY_MAP: Record<string, { label: string; variant: 'red' | 'orange' | 'blue' | 'gray' }> =
  {
    CRITICAL: { label: 'Critical', variant: 'red' },
    HIGH: { label: 'High', variant: 'orange' },
    NORMAL: { label: 'Normal', variant: 'blue' },
    LOW: { label: 'Low', variant: 'gray' },
  };

const KANBAN_COLUMNS = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export function TasksTab({ tasks }: TasksTabProps) {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeTasks = tasks.filter((t) => t.status !== 'CANCELLED');
  const filteredTasks =
    statusFilter === 'all' ? activeTasks : activeTasks.filter((t) => t.status === statusFilter);

  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const totalActive = activeTasks.length;

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
            const st = TASK_STATUS_MAP[col];
            return (
              <div key={col} className="bg-muted/30 min-w-[220px] flex-1 rounded-xl p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        col === 'DONE'
                          ? 'bg-green-500'
                          : col === 'IN_PROGRESS'
                            ? 'bg-purple-500'
                            : col === 'REVIEW'
                              ? 'bg-amber-500'
                              : col === 'TODO'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs font-semibold">{st?.label ?? col}</span>
                  </div>
                  <span className="bg-muted rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const pr = PRIORITY_MAP[task.priority];
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
                        {task.product && (
                          <p className="text-muted-foreground mt-1 text-[10px]">
                            {task.product.name}
                          </p>
                        )}
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
                <th className="px-4 py-2 text-left font-medium">Product</th>
                <th className="px-4 py-2 text-left font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const st = TASK_STATUS_MAP[task.status];
                const pr = PRIORITY_MAP[task.priority];
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
                      {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">{task.product?.name ?? '—'}</td>
                    <td className="text-muted-foreground px-4 py-2">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
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
