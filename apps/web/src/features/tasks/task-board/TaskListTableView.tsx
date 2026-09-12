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
import {
  getTaskStatus,
  isTaskPlanningStatusValue,
  isTaskStatusValue,
} from '@/features/tasks/constants/tasks';
import { useTranslations } from 'next-intl';
import { TASK_LIST_URGENT_FLAME_SIZE } from './task-card-urgent';
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
  const t = useTranslations('tasks');
  return (
    <div className={ENTITY_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('table.task')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>
              {boardScope === 'CLOSED' ? t('table.closed') : t('table.status')}
            </TableHead>
            <TableHead
              className={cn(ENTITY_LIST_HEAD_CLASS, 'w-12')}
              aria-label={t('table.urgent')}
            />
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('table.planning')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('table.due')}</TableHead>
            <TableHead className={ENTITY_LIST_HEAD_CLASS}>{t('table.assignee')}</TableHead>
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
  const t = useTranslations('tasks');
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
          <StatusBadge
            label={isTaskStatusValue(st.value) ? t(`status.${st.value}`) : st.label}
            variant={st.variant}
            className={ENTITY_LIST_BADGE_CLASS}
          />
        ) : (
          <EntityListMutedDash />
        )}
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <TaskUrgentFlameIndicator priority={task.priority} size={TASK_LIST_URGENT_FLAME_SIZE} />
      </TableCell>
      <TableCell className={ENTITY_LIST_CELL_CLASS}>
        <StatusBadge
          label={
            isTaskPlanningStatusValue(task.planningStatus)
              ? t(`planning.${task.planningStatus}`)
              : formatPlanningStatus(task.planningStatus)
          }
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
