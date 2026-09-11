import { cn } from '@/lib/utils';
import {
  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
  FINANCE_CALENDAR_STICKY_SURFACE_CLASS,
  FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';

export const SUB_LABEL_COL_CLASS = 'w-44 min-w-[11rem]';
export const SUB_MONTH_COL_CLASS = 'w-[4.5rem]';
export const STICKY_SURFACE_CLASS = FINANCE_CALENDAR_STICKY_SURFACE_CLASS;
export const TOTAL_STICKY_SURFACE_CLASS = FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS;

export const STICKY_LABEL_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky top-0 left-0 z-40 overflow-hidden border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
  STICKY_SURFACE_CLASS,
  SUB_LABEL_COL_CLASS,
);

export const STICKY_LABEL_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-20 cursor-pointer border-r border-b px-3 py-2',
  STICKY_SURFACE_CLASS,
  SUB_LABEL_COL_CLASS,
);

export const STICKY_TOTAL_HEADER_CLASS =
  'border-border text-foreground sticky top-0 right-0 z-40 border-l border-b px-1 py-1.5 text-center text-sm font-bold tracking-wide uppercase';

export const STICKY_TOTAL_CELL_CLASS =
  'border-border text-foreground sticky right-0 z-20 border-l border-b p-1 align-middle text-center';

export const STICKY_TOTAL_FOOTER_CLASS =
  'border-border text-foreground sticky right-0 z-30 border-l p-1 align-middle text-center';

export const SUB_MONTH_HEAD_CLASS = cn(
  'border-border sticky top-0 z-30 border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  STICKY_SURFACE_CLASS,
  SUB_MONTH_COL_CLASS,
);

export const SUB_MONTH_CELL_CLASS = cn(
  'border-border border-b p-1 align-middle',
  SUB_MONTH_COL_CLASS,
);

export const SUB_FOOTER_LABEL_CELL_CLASS = cn(
  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
  'border-border text-muted-foreground left-0 z-50 border-t border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
  SUB_LABEL_COL_CLASS,
);

export const SUB_FOOTER_MONTH_CELL_CLASS = cn(
  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
  SUB_MONTH_COL_CLASS,
  'border-border z-40 border-t p-1 text-center align-middle',
);
