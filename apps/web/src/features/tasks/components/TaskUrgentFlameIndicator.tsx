import { Flame } from 'lucide-react';
import { TASK_PRIORITY_FLAME_FILLED_CLASS } from '@/components/shared/quick-create-task/quick-create-task-constants';
import { cn } from '@/lib/utils';
import { isTaskUrgentPriority } from '../constants/tasks';

interface TaskUrgentFlameIndicatorProps {
  priority: string;
  size?: number;
  className?: string;
}

/** Flame shown on task cards and lists when priority is urgent. */
export function TaskUrgentFlameIndicator({
  priority,
  size = 12,
  className,
}: TaskUrgentFlameIndicatorProps) {
  if (!isTaskUrgentPriority(priority)) return null;

  return (
    <Flame
      size={size}
      strokeWidth={1.75}
      className={cn('shrink-0', TASK_PRIORITY_FLAME_FILLED_CLASS, className)}
      aria-label="Urgent"
    />
  );
}
