'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ENTITY_LIST_BADGE_CLASS,
  ENTITY_LIST_CELL_CLASS,
  ENTITY_LIST_HEAD_CLASS,
  ENTITY_LIST_ROW_HOVER_CLASS,
  ENTITY_LIST_SHELL_CLASS,
  EntityListDate,
  EntityListMutedDash,
  EntityListPrimaryCell,
  StatusBadge,
} from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { TaskUrgentFlameIndicator } from '@/features/tasks/components/TaskUrgentFlameIndicator';
import { getTaskStatus } from '@/features/tasks/constants/tasks';
import { formatPlanningStatus } from '@/features/tasks/work-spaces/work-space-utils';
import type { Task } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';

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
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Task</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {boardScope === 'CLOSED' ? 'Closed' : 'Status'}
            </TableHead>
            <TableHead className={cn(ENTITY_LIST_HEAD_CLASS, 'w-12')} aria-label="Urgent" />
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Planning</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Due</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TaskListRow key={task.id} task={task} onRowClick={onRowClick} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskListRow({ task, onRowClick }: { task: Task; onRowClick: (task: Task) => void }) {
  const st = getTaskStatus(task.status);
  const assigneeLabel = task.assignee
    ? `${task.assignee.firstName} ${task.assignee.lastName}`
    : null;

  return (
    <TableRow
      className={cn(ENTITY_LIST_ROW_HOVER_CLASS, 'cursor-pointer')}
      onClick={() => onRowClick(task)}
    >
      <TableCell className={cn(ENTITY_LIST_CELL_CLASS, 'max-w-[min(24rem,50vw)]')}>
        <EntityListPrimaryCell title={task.title} subtitle={task.code} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {st ? (
          <StatusBadge label={st.label} variant={st.variant} className={ENTITY_LIST_BADGE_CLASS} />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <TaskUrgentFlameIndicator priority={task.priority} size={14} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <StatusBadge
          label={formatPlanningStatus(task.planningStatus)}
          variant="gray"
          className={ENTITY_LIST_BADGE_CLASS}
        />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <EntityListDate value={task.dueDate} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        {assigneeLabel && task.assignee ? (
          <span className="flex min-w-0 items-center gap-2">
            <EmployeePersonAvatar
              label={assigneeLabel}
              imageUrl={task.assignee.avatar}
              className="size-7 text-[10px]"
            />
            <span className="truncate text-sm">{assigneeLabel}</span>
          </span>
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
    </TableRow>
  );
}
