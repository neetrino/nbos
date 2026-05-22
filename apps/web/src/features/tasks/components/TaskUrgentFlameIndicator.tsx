import { Flame } from 'lucide-react';
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
      className={cn('shrink-0 text-orange-500', className)}
      aria-label="Urgent"
    />
  );
}
