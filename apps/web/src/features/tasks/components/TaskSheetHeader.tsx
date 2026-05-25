import { Flame } from 'lucide-react';
import {
  QUICK_CREATE_TASK_HEADER_ICONS_CLASS,
  QUICK_CREATE_TASK_TITLE_ROW_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
} from '@/components/shared/quick-create-task/quick-create-task-constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isTaskUrgentPriority } from '../constants/tasks';
import type { TaskGeneralDraft } from '../task-general-form-state';

interface TaskSheetHeaderProps {
  draft: TaskGeneralDraft;
  disabled?: boolean;
  onPatchDraft: (partial: Partial<TaskGeneralDraft>) => void;
  onToggleUrgent: () => void;
}

export function TaskSheetHeader({
  draft,
  disabled = false,
  onPatchDraft,
  onToggleUrgent,
}: TaskSheetHeaderProps) {
  const urgent = isTaskUrgentPriority(draft.priority);

  return (
    <header>
      <div className={QUICK_CREATE_TASK_TITLE_ROW_CLASS}>
        <input
          value={draft.title}
          onChange={(e) => onPatchDraft({ title: e.target.value })}
          disabled={disabled}
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
              urgent && TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
            )}
            aria-pressed={urgent}
            aria-label={urgent ? 'Urgent' : 'Mark as urgent'}
            title={urgent ? 'Urgent' : 'Mark as urgent'}
            disabled={disabled}
            onClick={onToggleUrgent}
          >
            <Flame size={19} strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
