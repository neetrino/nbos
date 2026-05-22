import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TASK_SHEET_META_LABEL_CLASS } from './task-sheet-classes';

interface TaskSheetCompactRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Bitrix-style label (left) + value (right) row inside task sheet cards. */
export function TaskSheetCompactRow({ label, children, className }: TaskSheetCompactRowProps) {
  return (
    <div
      className={cn(
        'border-border/50 flex items-center gap-x-3 border-b py-2 last:border-b-0',
        className,
      )}
    >
      <span className={TASK_SHEET_META_LABEL_CLASS}>{label}</span>
      <div className="w-auto min-w-0">{children}</div>
    </div>
  );
}

/** Hides the built-in top label and tightens control shells in compact rows. */
export const TASK_SHEET_COMPACT_FIELD_CLASS = [
  'w-auto max-w-none',
  '[&>div:first-child]:sr-only [&>div:first-child]:mb-0 [&>div:first-child]:h-0 [&>div:first-child]:overflow-hidden',
  '[&>div:last-child]:w-auto [&>div:last-child]:max-w-[18rem]',
  '[&_.w-full]:w-auto',
  '[&_[class*="min-h-10"]]:min-h-8 [&_[class*="min-h-10"]]:py-1',
  '[&_button]:min-h-8',
].join(' ');
