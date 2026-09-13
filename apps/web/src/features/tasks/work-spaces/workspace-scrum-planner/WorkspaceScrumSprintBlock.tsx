'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resolveDatePickerLocale } from '@/components/shared/date-picker/date-picker-locale';
import type { Task } from '@/lib/api/tasks';
import type { WorkSpaceSprint } from '@/lib/api/work-space-sprints';
import { sprintCompletionPercent } from '../workspace-scrum-groups';
import { WorkspaceScrumTaskRow } from './WorkspaceScrumTaskRow';
import { useScrumDropTarget } from './use-scrum-drop-target';

export function WorkspaceScrumSprintBlock({
  sprint,
  tasks,
  variant,
  onDropTask,
  onOpenTask,
  onStart,
  onFinish,
}: {
  sprint: WorkSpaceSprint;
  tasks: Task[];
  variant: 'active' | 'planning' | 'closed';
  onDropTask: (taskId: string) => void;
  onOpenTask: (task: Task) => void;
  onStart?: () => void;
  onFinish?: () => void;
}) {
  const t = useTranslations('workSpaces');
  const locale = useLocale();
  const drop = useScrumDropTarget(onDropTask);
  const pct = sprintCompletionPercent(tasks);
  const disabled = variant === 'closed';
  const due = sprint.endDate
    ? t('scrum.due', {
        date: new Date(sprint.endDate).toLocaleDateString(resolveDatePickerLocale(locale)),
      })
    : null;

  return (
    <article
      className={`border-border rounded-xl border p-3 ${variant === 'active' ? 'bg-primary/5' : 'bg-card/30'}`}
      {...(disabled ? {} : drop)}
    >
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">{sprint.name}</h4>
          <p className="text-muted-foreground text-xs">
            {t('scrum.donePercent', { pct })} · {t('tasksCount', { count: tasks.length })}
            {due ? ` · ${due}` : ''}
          </p>
          {sprint.goal ? <p className="text-muted-foreground mt-1 text-xs">{sprint.goal}</p> : null}
        </div>
        <div className="flex gap-1">
          {variant === 'planning' && onStart ? (
            <Button type="button" size="sm" onClick={onStart}>
              {t('scrum.start')}
            </Button>
          ) : null}
          {variant === 'active' && onFinish ? (
            <Button type="button" size="sm" onClick={onFinish}>
              {t('scrum.finish')}
            </Button>
          ) : null}
        </div>
      </header>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-lg border border-dashed p-3 text-center text-xs">
            {disabled ? t('scrum.noTasks') : t('scrum.sprintEmpty')}
          </p>
        ) : (
          tasks.map((task) => (
            <WorkspaceScrumTaskRow key={task.id} task={task} onOpen={onOpenTask} />
          ))
        )}
      </div>
    </article>
  );
}
