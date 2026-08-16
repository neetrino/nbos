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
  if (hideLabel) {
    return <div className={cn(TASK_SHEET_META_VALUE_COLUMN_CLASS, className)}>{children}</div>;
  }

  return (
    <div className={cn(TASK_SHEET_OUTLINED_FIELD_WRAP_CLASS, className)}>
      <span className={TASK_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>
      <div className={TASK_SHEET_META_VALUE_COLUMN_CLASS}>{children}</div>
    </div>
  );
}

const TASK_SHEET_COMPACT_FIELD_BASE_CLASS = [
  'w-full min-w-0 max-w-full',
  '[&>div:last-child]:w-full [&>div:last-child]:max-w-full',
  '[&_.w-full]:w-full',
  '[&_.border]:border-border/50',
  '[&_.person-soft-avatar]:size-8 [&_.person-soft-avatar]:text-[10px]',
  '[&_button_span.block.truncate]:overflow-visible',
  '[&_button_span.block.truncate]:whitespace-nowrap',
].join(' ');

/** Fills the meta value column; hides the picker’s old header row. */
export const TASK_SHEET_COMPACT_FIELD_CLASS = [
  TASK_SHEET_COMPACT_FIELD_BASE_CLASS,
  '[&>div:first-child]:sr-only [&>div:first-child]:mb-0 [&>div:first-child]:h-0 [&>div:first-child]:overflow-hidden',
].join(' ');

/** Employee pickers draw their own outlined label — do not hide the first child. */
export const TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS = TASK_SHEET_COMPACT_FIELD_BASE_CLASS;
