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
  const minHeight = heightPx && heightPx > 0 ? heightPx : KANBAN_DROP_PLACEHOLDER_MIN_HEIGHT_PX;
  const style: CSSProperties = { minHeight };

  return <div className={cn(KANBAN_DROP_PLACEHOLDER_CLASS, className)} style={style} aria-hidden />;
}
