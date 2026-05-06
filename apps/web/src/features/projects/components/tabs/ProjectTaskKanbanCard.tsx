'use client';

import { AlertTriangle, Play, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';
import { getTaskPriority } from '@/features/tasks/constants/tasks';
import { resolveTaskOrderContext } from '@/features/tasks/utils/task-order-context';

export function ProjectTaskKanbanCard({
  task,
  onOpen,
  onAction,
}: {
  task: Task;
  onOpen: () => void;
  onAction: (id: string, action: 'start' | 'complete' | 'reopen') => void;
}) {
  const pr = getTaskPriority(task.priority);
  const orderCtx = resolveTaskOrderContext(task);
  return (
    <div className="bg-card border-border rounded-lg border p-3">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs leading-tight font-medium">{task.title}</p>
          {task.priority === 'CRITICAL' && (
            <AlertTriangle size={12} className="shrink-0 text-red-500" />
          )}
        </div>
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-[10px]">
          <span>{task.code}</span>
          {pr && <StatusBadge label={pr.label} variant={pr.variant} />}
        </div>
        {orderCtx && (
          <p className="text-muted-foreground mt-1 text-[10px]">
            <span className="text-foreground font-medium">{orderCtx.orderCode}</span>
            {' · '}
            {orderCtx.scopeLabel}
          </p>
        )}
      </button>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
            {task.assignee.firstName[0]}
            {task.assignee.lastName[0]}
          </div>
          <span className="text-muted-foreground text-[10px]">{task.assignee.firstName}</span>
        </div>
      )}
      <div className="mt-2 flex gap-1">
        {task.status === 'NEW' && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction(task.id, 'start');
            }}
            title="Start"
          >
            <Play size={10} />
          </Button>
        )}
        {task.status === 'IN_PROGRESS' && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction(task.id, 'complete');
            }}
            title="Complete"
          >
            <Check size={10} />
          </Button>
        )}
        {task.status === 'DONE' && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAction(task.id, 'reopen');
            }}
            title="Reopen"
          >
            <RotateCcw size={10} />
          </Button>
        )}
      </div>
    </div>
  );
}
