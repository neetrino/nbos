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
  /** Two grid cells for aligned label column inside {@link TASK_SHEET_TEAM_META_GRID_CLASS}. */
  gridCells?: boolean;
}

/** Bitrix-style label (left) + value (right) row inside task sheet cards. */
export function TaskSheetCompactRow({
  label,
  children,
  className,
  hideLabel = false,
  alignEnd = false,
  gridCells = false,
}: TaskSheetCompactRowProps) {
  if (gridCells) {
    return (
      <div
        className={cn(
          'flex w-full min-w-0 items-center gap-x-3 py-1',
          '@min-[42rem]/task-sheet-meta:contents @min-[42rem]/task-sheet-meta:py-0',
          className,
        )}
      >
        {hideLabel ? null : <span className={TASK_SHEET_META_LABEL_CLASS}>{label}</span>}
        <div className={cn(TASK_SHEET_META_VALUE_COLUMN_CLASS, hideLabel && 'col-span-2')}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-center gap-x-3 py-1',
        alignEnd && '@min-[42rem]/task-sheet-meta:justify-end',
        className,
      )}
    >
      {hideLabel ? null : <span className={TASK_SHEET_META_LABEL_CLASS}>{label}</span>}
      <div className={cn(TASK_SHEET_META_VALUE_COLUMN_CLASS, hideLabel && 'max-w-[15.5rem]')}>
        {children}
      </div>
    </div>
  );
}

/** Fills the meta value column; defers border/height to detail-sheet shells. */
export const TASK_SHEET_COMPACT_FIELD_CLASS = [
  'w-full min-w-0 max-w-[15.5rem]',
  '[&>div:first-child]:sr-only [&>div:first-child]:mb-0 [&>div:first-child]:h-0 [&>div:first-child]:overflow-hidden',
  '[&>div:last-child]:w-full [&>div:last-child]:max-w-[15.5rem]',
  '[&_.w-full]:w-full',
  '[&_span.rounded-xl]:min-h-8 [&_span.rounded-xl]:py-1',
  '[&_button_span.block.truncate]:overflow-visible',
  '[&_button_span.block.truncate]:whitespace-nowrap',
].join(' ');
