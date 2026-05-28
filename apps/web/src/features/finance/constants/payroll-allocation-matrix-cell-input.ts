import {
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

/** Shown when employee is linked and a bonus entry exists — empty release field. */
export const PAYROLL_MATRIX_CELL_RELEASE_PLACEHOLDER = 'Enter bonus';

/** Finance field shell — same hover/focus treatment as detail sheet money fields. */
export const PAYROLL_MATRIX_CELL_FIELD_SHELL_CLASS = cn(
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'flex w-full min-h-8 items-center justify-end gap-0.5 rounded-lg px-2 py-0.5',
);

/** Money input inside matrix cell shell. */
export const PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS = cn(
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  'min-w-0 text-right text-xs tabular-nums placeholder:text-muted-foreground placeholder:text-[10px]',
);

export const PAYROLL_MATRIX_CELL_REASON_CLASS = cn(
  DETAIL_SHEET_FIELD_SHELL_HOVER_BORDER_CLASS,
  'min-h-[2rem] w-full resize-none rounded-lg border px-2 py-1 text-[10px] shadow-none focus-visible:ring-0',
);

/** Read-only release amount in grid cells (`3 500 000֏`). */
export const PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS = 'text-xs tabular-nums';
