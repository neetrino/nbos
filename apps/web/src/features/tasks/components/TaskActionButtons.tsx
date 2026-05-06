import { CheckCircle2, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/api/tasks';

interface TaskActionButtonsProps {
  task: Task;
  onAction: (action: 'start' | 'complete' | 'reopen' | 'defer') => void;
}

export function TaskActionButtons({ task, onAction }: TaskActionButtonsProps) {
  if (task.status === 'OPEN') {
    return (
      <Button size="sm" variant="outline" onClick={() => onAction('start')}>
        <Play size={14} /> Start
      </Button>
    );
  }

  if (task.status === 'IN_PROGRESS' || task.status === 'REVIEW') {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => onAction('defer')}>
          <Pause size={14} /> Defer
        </Button>
        <Button size="sm" onClick={() => onAction('complete')}>
          <CheckCircle2 size={14} /> Complete
        </Button>
      </>
    );
  }

  if (['COMPLETED', 'DONE', 'DEFERRED', 'CANCELLED'].includes(task.status)) {
    return (
      <Button size="sm" variant="outline" onClick={() => onAction('reopen')}>
        <RotateCcw size={14} /> Reopen
      </Button>
    );
  }

  return null;
}
