import { Flame } from 'lucide-react';
import {
  QUICK_CREATE_TASK_HEADER_ICONS_CLASS,
  QUICK_CREATE_TASK_TITLE_ROW_CLASS,
} from '@/components/shared/quick-create-task/quick-create-task-constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isTaskHighPriority, toggleTaskHighPriority } from '../constants/tasks';
import type { TaskGeneralDraft } from '../task-general-form-state';

interface TaskSheetHeaderProps {
  draft: TaskGeneralDraft;
  saving: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
}

export function TaskSheetHeader({ draft, saving, onPatchDraft }: TaskSheetHeaderProps) {
  const highPriority = isTaskHighPriority(draft.priority);

  return (
    <header>
      <div className={QUICK_CREATE_TASK_TITLE_ROW_CLASS}>
        <input
          value={draft.title}
          onChange={(e) => onPatchDraft({ title: e.target.value })}
          disabled={saving}
          placeholder="Task title…"
          aria-label="Task title"
          className="text-foreground placeholder:text-muted-foreground/55 w-full border-0 bg-transparent py-0 text-2xl leading-snug font-bold tracking-tight outline-none disabled:opacity-60 sm:text-[1.65rem]"
        />
        <div className={QUICK_CREATE_TASK_HEADER_ICONS_CLASS}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              'text-muted-foreground/75 size-8 rounded-full hover:text-orange-600',
              highPriority &&
                'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/40',
            )}
            aria-pressed={highPriority}
            aria-label={highPriority ? 'High priority on' : 'Mark as high priority'}
            title={highPriority ? 'High priority' : 'Set high priority'}
            disabled={saving}
            onClick={() => onPatchDraft({ priority: toggleTaskHighPriority(draft.priority) })}
          >
            <Flame size={19} strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
