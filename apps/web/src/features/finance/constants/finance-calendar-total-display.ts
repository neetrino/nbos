/**
 * At this viewport width and above, calendar Total stays full amount
 * regardless of app sidebar open/collapsed (large desktop / iMac).
 * Matches Tailwind default `2xl`.
 */
export const FINANCE_CALENDAR_FULL_TOTAL_MIN_VIEWPORT_PX = 1536;

/** Narrow Total column when showing abbreviated `150K`. */
export const FINANCE_CALENDAR_TOTAL_COL_COMPACT_CLASS = 'w-[99px] min-w-[99px]';

/** Wider Total column so grouped full amounts (`3 500 000`) fit. */
export const FINANCE_CALENDAR_TOTAL_COL_FULL_CLASS = 'w-[8.5rem] min-w-[8.5rem]';

/** True → full grouped amount; false → abbreviated `K` / `M`. */
export function resolveFinanceCalendarPreferFullTotal(
  sidebarCollapsed: boolean,
  isWideViewport: boolean,
): boolean {
  return isWideViewport || sidebarCollapsed;
}

export function financeCalendarTotalColClass(preferFullTotal: boolean): string {
  return preferFullTotal
    ? FINANCE_CALENDAR_TOTAL_COL_FULL_CLASS
    : FINANCE_CALENDAR_TOTAL_COL_COMPACT_CLASS;
}
