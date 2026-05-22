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
}

/** Bitrix-style label (left) + value (right) row inside task sheet cards. */
export function TaskSheetCompactRow({ label, children, className }: TaskSheetCompactRowProps) {
  return (
    <div className={cn('flex items-center gap-x-3 py-1', className)}>
      <span className={TASK_SHEET_META_LABEL_CLASS}>{label}</span>
      <div className={TASK_SHEET_META_VALUE_COLUMN_CLASS}>{children}</div>
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
