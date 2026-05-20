'use client';

import { StatusBadge } from '@/components/shared';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { getTaskPriority, getTaskStatus } from '@/features/tasks/constants/tasks';
import { formatPlanningStatus } from '@/features/tasks/work-spaces/work-space-utils';
import type { Task } from '@/lib/api/tasks';

export function TaskListTableView({
  tasks,
  boardScope = 'ALL',
  onRowClick,
}: {
  tasks: Task[];
  boardScope?: BoardLifecycleScope;
  onRowClick: (task: Task) => void;
}) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Task</th>
            <th className="px-4 py-2 text-left font-medium">
              {boardScope === 'CLOSED' ? 'Closed' : 'Status'}
            </th>
            <th className="px-4 py-2 text-left font-medium">Priority</th>
            <th className="px-4 py-2 text-left font-medium">Planning</th>
            <th className="px-4 py-2 text-left font-medium">Due</th>
            <th className="px-4 py-2 text-left font-medium">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const st = getTaskStatus(task.status);
            const pr = getTaskPriority(task.priority);
            return (
              <tr
                key={task.id}
                className="border-border hover:bg-muted/40 cursor-pointer border-t"
                onClick={() => onRowClick(task)}
              >
                <td className="px-4 py-2">
                  <p className="max-w-[min(24rem,50vw)] truncate font-medium" title={task.title}>
                    {task.title}
                  </p>
                  <p className="text-muted-foreground text-xs">{task.code}</p>
                </td>
                <td className="px-4 py-2">
                  {st && <StatusBadge label={st.label} variant={st.variant} />}
                </td>
                <td className="px-4 py-2">
                  {pr && <StatusBadge label={pr.label} variant={pr.variant} />}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge label={formatPlanningStatus(task.planningStatus)} variant="gray" />
                </td>
                <td className="text-muted-foreground px-4 py-2">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                </td>
                <td className="text-muted-foreground px-4 py-2">
                  {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
