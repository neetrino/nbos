import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import {
  KANBAN_DROP_PLACEHOLDER_CLASS,
  KANBAN_DROP_PLACEHOLDER_MIN_HEIGHT_PX,
} from './kanban-column-surface';

/** Soft card silhouette shown in the column that will receive the dragged item. */
export function KanbanDropPlaceholder({
  className,
  heightPx,
}: {
  className?: string;
  heightPx?: number | null;
}) {
  const measured = typeof heightPx === 'number' && heightPx > 0;
  const style: CSSProperties = measured
    ? { height: heightPx, minHeight: heightPx }
    : { minHeight: KANBAN_DROP_PLACEHOLDER_MIN_HEIGHT_PX };

  return (
    <div
      className={cn(KANBAN_DROP_PLACEHOLDER_CLASS, measured && '!min-h-0', className)}
      style={style}
      aria-hidden
    />
  );
}
