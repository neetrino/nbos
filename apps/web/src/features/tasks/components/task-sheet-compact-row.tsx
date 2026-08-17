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
  /** When true, only the value is shown (child draws its own outlined caption). */
  hideLabel?: boolean;
}

/** Outlined field row — caption on the border, or width wrapper when `hideLabel`. */
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
].join(' ');

/** Employee pickers draw their own outlined label — do not hide the first child. */
export const TASK_SHEET_COMPACT_EMPLOYEE_FIELD_CLASS = TASK_SHEET_COMPACT_FIELD_BASE_CLASS;
