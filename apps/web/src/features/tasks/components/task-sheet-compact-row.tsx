import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
        'border-border/50 grid grid-cols-[minmax(5.75rem,34%)_minmax(0,1fr)] items-center gap-x-3 border-b py-2 last:border-b-0',
        className,
      )}
    >
      <span className="text-muted-foreground text-xs leading-snug">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Hides the built-in top label and tightens control shells in compact rows. */
export const TASK_SHEET_COMPACT_FIELD_CLASS = [
  '[&>div:first-child]:sr-only [&>div:first-child]:mb-0 [&>div:first-child]:h-0 [&>div:first-child]:overflow-hidden',
  '[&_[class*="min-h-10"]]:min-h-8 [&_[class*="min-h-10"]]:py-1',
  '[&_button]:min-h-8',
].join(' ');
