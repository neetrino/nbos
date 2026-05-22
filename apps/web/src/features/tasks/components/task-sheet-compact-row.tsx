import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  TASK_SHEET_META_LABEL_CLASS,
  TASK_SHEET_META_VALUE_COLUMN_CLASS,
} from './task-sheet-classes';

interface TaskSheetCompactRowProps {
  label: string;
  children: ReactNode;
  className?: string;
  /** When true, only the value column is shown (placeholder carries the role hint). */
  hideLabel?: boolean;
  /** Align label + field to the right (assistant / observer column). */
  alignEnd?: boolean;
}

/** Bitrix-style label (left) + value (right) row inside task sheet cards. */
export function TaskSheetCompactRow({
  label,
  children,
  className,
  hideLabel = false,
  alignEnd = false,
}: TaskSheetCompactRowProps) {
  return (
    <div
      className={cn('flex items-center gap-x-3 py-1', alignEnd && 'w-full justify-end', className)}
    >
      {hideLabel ? null : <span className={TASK_SHEET_META_LABEL_CLASS}>{label}</span>}
      <div
        className={cn(TASK_SHEET_META_VALUE_COLUMN_CLASS, hideLabel && 'w-[15.5rem] max-w-full')}
      >
        {children}
      </div>
    </div>
  );
}

/** Fills the meta value column; defers border/height to detail-sheet shells. */
export const TASK_SHEET_COMPACT_FIELD_CLASS = [
  'w-full min-w-0 max-w-none',
  '[&>div:first-child]:sr-only [&>div:first-child]:mb-0 [&>div:first-child]:h-0 [&>div:first-child]:overflow-hidden',
  '[&>div:last-child]:w-full [&>div:last-child]:max-w-none',
  '[&_.w-full]:w-full',
].join(' ');
