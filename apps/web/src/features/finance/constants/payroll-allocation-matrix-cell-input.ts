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
  'flex w-full min-h-8 min-w-0 items-center justify-end gap-0.5 overflow-hidden rounded-lg px-2 py-0.5',
);

/** Fixed slot so focus / dram icon never widens the column. */
export const PAYROLL_MATRIX_CELL_CURRENCY_SLOT_CLASS =
  'inline-flex w-3 shrink-0 items-center justify-center';

/** Money input inside matrix cell shell. */
export const PAYROLL_MATRIX_CELL_MONEY_INPUT_CLASS = cn(
  DETAIL_SHEET_FIELD_INNER_CONTROL_CLASS,
  'min-w-0 flex-1 text-right text-xs tabular-nums placeholder:text-muted-foreground placeholder:text-[10px]',
);

export const PAYROLL_MATRIX_CELL_WARNING_CLASS =
  'truncate text-center text-[10px] font-medium text-black dark:text-black';

/** Read-only release amount in grid cells (`3 500 000֏`). */
export const PAYROLL_MATRIX_CELL_AMOUNT_DISPLAY_CLASS =
  'block w-full min-w-0 truncate text-right text-xs tabular-nums text-black dark:text-black';
