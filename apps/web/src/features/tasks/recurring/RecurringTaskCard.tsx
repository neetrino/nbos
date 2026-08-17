'use client';

import { CalendarClock, Repeat, UserRound } from 'lucide-react';
import {
  PRODUCT_DETAIL_CARD_ICON_TILE_CLASS,
  PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS,
  PRODUCT_DETAIL_CARD_SHELL_CLASS,
  PRODUCT_DETAIL_CARD_STAT_CELL_CLASS,
  PRODUCT_DETAIL_CARD_STATS_SHELL_CLASS,
  NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS,
  StatusBadge,
} from '@/components/shared';
import { formatEmployeeDisplayName } from '@/features/tasks/task-employee-labels';
import { isTaskUrgentPriority } from '@/features/tasks/constants/tasks';
import type { RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import { cn } from '@/lib/utils';
import { formatRecurringDateTime, formatRecurringSchedule } from './recurring-schedule-label';

interface RecurringTaskCardProps {
  template: RecurringTaskTemplate;
  onOpen: (id: string) => void;
}

export function RecurringTaskCard({ template, onOpen }: RecurringTaskCardProps) {
  const assignee = template.assignee
    ? formatEmployeeDisplayName(template.assignee.firstName, template.assignee.lastName)
    : 'Unassigned';

  return (
    <div className={cn(PRODUCT_DETAIL_CARD_SHELL_CLASS, NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS)}>
      <button
        type="button"
        className="flex min-h-0 flex-1 flex-col p-5 text-left focus-visible:outline-none"
        onClick={() => onOpen(template.id)}
      >
        <div className="flex items-start gap-3">
          <span className={PRODUCT_DETAIL_CARD_ICON_TILE_CLASS}>
            <Repeat className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground truncate text-base font-semibold">{template.title}</h2>
              <StatusBadge
                label={template.isActive ? 'Active' : 'Paused'}
                variant={template.isActive ? 'green' : 'gray'}
              />
              {isTaskUrgentPriority(template.priority) ? (
                <StatusBadge label="Urgent" variant="orange" />
              ) : null}
            </div>
            {template.description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {template.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-muted-foreground mt-4 space-y-1.5 text-sm">
          <p className="flex items-center gap-2">
            <CalendarClock className="size-3.5 shrink-0" aria-hidden />
            {formatRecurringSchedule(template)}
          </p>
          <p className="flex items-center gap-2">
            <UserRound className="size-3.5 shrink-0" aria-hidden />
            {assignee}
          </p>
        </div>
      </button>

      <div className={cn(PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS, 'p-3')}>
        <div className={PRODUCT_DETAIL_CARD_STATS_SHELL_CLASS}>
          <div className={PRODUCT_DETAIL_CARD_STAT_CELL_CLASS}>
            <p className="text-foreground text-sm font-medium">
              {formatRecurringDateTime(template.nextCreateAt)}
            </p>
            <p className="text-muted-foreground text-xs">Next</p>
          </div>
          <div className={PRODUCT_DETAIL_CARD_STAT_CELL_CLASS}>
            <p className="text-foreground text-sm font-medium">
              {formatRecurringDateTime(template.lastCreatedAt)}
            </p>
            <p className="text-muted-foreground text-xs">Last created</p>
          </div>
          <div className={PRODUCT_DETAIL_CARD_STAT_CELL_CLASS}>
            <p className="text-foreground text-sm font-medium">{template.spawnedTaskCount}</p>
            <p className="text-muted-foreground text-xs">Tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
