/**
 * Shared mobile year-calendar board tokens (subscriptions, expense plans, salary).
 * Phone: 12 months as a 4×3 grid so every month stays on screen.
 */

export const FINANCE_CALENDAR_MOBILE_MIN_YEAR = 2020;

export const FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET = 2;

export const FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS = 'grid grid-cols-4 gap-2';

export const FINANCE_CALENDAR_MOBILE_MONTH_CELL_CLASS =
  'flex min-h-12 w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1 text-center transition-colors';

export const FINANCE_CALENDAR_MOBILE_MONTH_CAPTION_CLASS =
  'text-[10px] font-semibold tracking-wide uppercase';

export const FINANCE_CALENDAR_MOBILE_CURRENT_MONTH_CLASS = 'ring-primary/45 ring-2';

export const FINANCE_CALENDAR_MOBILE_YEAR_CONTROL_WIDTH_CLASS = 'max-w-[11rem]';

export const FINANCE_CALENDAR_MOBILE_BOARD_SCROLL_CLASS =
  'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain pb-2';

export interface FinanceCalendarMonthLabel {
  key: number;
  label: string;
}

export function financeCalendarMonthLabels(
  year: number,
  locale = 'en-US',
): FinanceCalendarMonthLabel[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
    return {
      key: index,
      label: date.toLocaleString(locale, { month: 'short' }),
    };
  });
}

export function financeCalendarCurrentMonthIndex(year: number): number | null {
  const now = new Date();
  if (year !== now.getFullYear()) return null;
  return now.getMonth();
}
