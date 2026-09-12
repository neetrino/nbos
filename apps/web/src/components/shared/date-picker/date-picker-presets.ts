import {
  addDays,
  addWeeks,
  endOfMonth,
  endOfWeek,
  isFriday,
  isSaturday,
  isSunday,
  nextFriday,
  startOfDay,
} from 'date-fns';

export type DatePickerPresetId = 'today' | 'tomorrow' | 'endOfWeek' | 'inOneWeek' | 'endOfMonth';

export interface DatePickerPreset {
  id: DatePickerPresetId;
  date: Date;
  subtitle: string;
}

function endOfBusinessWeek(from: Date): Date {
  if (isFriday(from) || isSaturday(from) || isSunday(from)) {
    return startOfDay(nextFriday(from));
  }
  return startOfDay(endOfWeek(from, { weekStartsOn: 1 }));
}

export function buildDatePickerPresets(anchor: Date, locale: string): DatePickerPreset[] {
  const today = startOfDay(anchor);
  const intlSubtitle = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const entries: Array<{ id: DatePickerPresetId; date: Date }> = [
    { id: 'today', date: today },
    { id: 'tomorrow', date: addDays(today, 1) },
    { id: 'endOfWeek', date: endOfBusinessWeek(today) },
    { id: 'inOneWeek', date: addWeeks(today, 1) },
    { id: 'endOfMonth', date: endOfMonth(today) },
  ];

  return entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    subtitle: intlSubtitle.format(entry.date),
  }));
}

export function buildMonthPickerMonthLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, monthIndex) =>
    formatter.format(new Date(2024, monthIndex, 1)),
  );
}

export function formatMonthYearHeader(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}
