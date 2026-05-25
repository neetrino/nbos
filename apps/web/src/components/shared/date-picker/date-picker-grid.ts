import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';

export type CalendarGridCell = {
  date: Date;
  inCurrentMonth: boolean;
};

export function buildMonthGrid(viewMonth: Date): CalendarGridCell[] {
  const monthStart = startOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthEnd = endOfMonth(viewMonth);
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const cells: CalendarGridCell[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    cells.push({
      date: cursor,
      inCurrentMonth: isSameMonth(cursor, viewMonth),
    });
    cursor = addDays(cursor, 1);
  }
  return cells;
}

export function getWeekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => formatter.format(addDays(monday, index)));
}

export function navigateViewMonth(viewMonth: Date, delta: -1 | 1): Date {
  return delta === -1 ? subMonths(viewMonth, 1) : addMonths(viewMonth, 1);
}

export { isSameDay, isSameMonth, isToday, isWeekend };
