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
  label: string;
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

  const entries: Array<{ id: DatePickerPresetId; label: string; date: Date }> = [
    { id: 'today', label: 'Today', date: today },
    { id: 'tomorrow', label: 'Tomorrow', date: addDays(today, 1) },
    { id: 'endOfWeek', label: 'End of week', date: endOfBusinessWeek(today) },
    { id: 'inOneWeek', label: 'In one week', date: addWeeks(today, 1) },
    { id: 'endOfMonth', label: 'End of month', date: endOfMonth(today) },
  ];

  return entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
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
