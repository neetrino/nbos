import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  TASK_SHEET_META_VALUE_COLUMN_CLASS,
  TASK_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  TASK_SHEET_OUTLINED_LABEL_CLASS,
} from './task-sheet-classes';

interface TaskSheetCompactRowProps {
  label: string;
  children: ReactNode;
  className?: string;
  /** When true, only the value is shown (placeholder carries the role hint). */
  hideLabel?: boolean;
  /** @deprecated Outlined fields no longer right-align. */
  alignEnd?: boolean;
  /** @deprecated Outlined fields no longer use a label/value grid. */
  gridCells?: boolean;
}

/** Outlined field: name sits on the top border (Creator, Assignee, …). */
export function TaskSheetCompactRow({
  label,
  children,
  className,
  hideLabel = false,
}: TaskSheetCompactRowProps) {
  return (
    <div className={cn(TASK_SHEET_OUTLINED_FIELD_WRAP_CLASS, className)}>
      {hideLabel ? null : <span className={TASK_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>}
      <div className={TASK_SHEET_META_VALUE_COLUMN_CLASS}>{children}</div>
    </div>
  );
}

/** Fills the meta value column; defers height to detail-sheet shells. */
export const TASK_SHEET_COMPACT_FIELD_CLASS = [
  'w-full min-w-0 max-w-full @min-[48rem]/task-sheet-meta:max-w-[15.5rem]',
  '[&>div:first-child]:sr-only [&>div:first-child]:mb-0 [&>div:first-child]:h-0 [&>div:first-child]:overflow-hidden',
  '[&>div:last-child]:w-full [&>div:last-child]:max-w-full @min-[48rem]/task-sheet-meta:[&>div:last-child]:max-w-[15.5rem]',
  '[&_.w-full]:w-full',
  '[&_.border]:border-border/50',
  '[&_.person-soft-avatar]:size-8 [&_.person-soft-avatar]:text-[10px]',
  '[&_button_span.block.truncate]:overflow-visible',
  '[&_button_span.block.truncate]:whitespace-nowrap',
].join(' ');
