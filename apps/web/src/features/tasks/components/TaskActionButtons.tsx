import { CheckCircle2, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';

interface TaskActionButtonsProps {
  task: Task;
  onAction: (action: 'start' | 'complete' | 'reopen' | 'hold') => void;
  disabled?: boolean;
}

export function TaskActionButtons({ task, onAction, disabled = false }: TaskActionButtonsProps) {
  if (task.status === 'OPEN' || task.status === 'NEW') {
    return (
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => onAction('start')}>
        <Play size={14} /> Start
      </Button>
    );
  }

  if (task.status === 'IN_PROGRESS' || task.status === 'REVIEW') {
    return (
      <>
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => onAction('hold')}>
          <Pause size={14} /> On hold
        </Button>
        <Button size="sm" disabled={disabled} onClick={() => onAction('complete')}>
          <CheckCircle2 size={14} /> Complete
        </Button>
      </>
    );
  }

  if (['COMPLETED', 'DONE', 'ON_HOLD'].includes(task.status)) {
    return (
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => onAction('reopen')}>
        <RotateCcw size={14} /> Reopen
      </Button>
    );
  }

  return null;
}
