'use client';

import { ChevronRight } from 'lucide-react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api/tasks';
import {
  formatAssigneeShortName,
  formatTaskCardPeoplePairLabel,
  TASK_CARD_PEOPLE_CHEVRON_SIZE,
  TASK_CARD_PERSON_AVATAR_CLASS,
} from './task-mini-card-meta';

export function TaskCardPeoplePair({
  creator,
  assignee,
}: {
  creator: Task['creator'];
  assignee: Task['assignee'];
}) {
  const pairLabel = formatTaskCardPeoplePairLabel(creator, assignee);
  const creatorLabel = formatAssigneeShortName(creator.firstName, creator.lastName);
  const assigneeLabel = assignee
    ? formatAssigneeShortName(assignee.firstName, assignee.lastName)
    : 'Unassigned';

  return (
    <div className="flex min-w-0 items-center gap-0.5" title={pairLabel} aria-label={pairLabel}>
      <span title={`Set by ${creatorLabel}`} className="shrink-0">
        <EmployeePersonAvatar
          label={creatorLabel}
          imageUrl={creator.avatar}
          className={TASK_CARD_PERSON_AVATAR_CLASS}
        />
      </span>
      <ChevronRight
        size={TASK_CARD_PEOPLE_CHEVRON_SIZE}
        className="text-muted-foreground shrink-0"
        aria-hidden
      />
      <span title={assigneeLabel} className="shrink-0">
        {assignee ? (
          <EmployeePersonAvatar
            label={assigneeLabel}
            imageUrl={assignee.avatar}
            className={TASK_CARD_PERSON_AVATAR_CLASS}
          />
        ) : (
          <EmployeePersonAvatar
            label="?"
            className={cn(TASK_CARD_PERSON_AVATAR_CLASS, 'bg-muted/60 text-muted-foreground')}
          />
        )}
      </span>
    </div>
  );
}
