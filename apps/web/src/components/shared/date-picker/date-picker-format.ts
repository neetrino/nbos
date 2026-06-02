import { format, isValid, parse, parseISO, startOfDay } from 'date-fns';
import { NBOS_DATE_STORAGE_FORMAT, NBOS_MONTH_STORAGE_FORMAT } from './date-picker-constants';

export function parseIsoDateValue(value: string | undefined | null): Date | undefined {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return undefined;
  const parsed = parseISO(trimmed.length === 7 ? `${trimmed}-01` : trimmed);
  return isValid(parsed) ? startOfDay(parsed) : undefined;
}

export function formatIsoDateValue(date: Date | undefined): string {
  if (!date || !isValid(date)) return '';
  return format(date, NBOS_DATE_STORAGE_FORMAT);
}

export function formatIsoMonthValue(date: Date | undefined): string {
  if (!date || !isValid(date)) return '';
  return format(date, NBOS_MONTH_STORAGE_FORMAT);
}

export function parseIsoMonthValue(value: string | undefined | null): Date | undefined {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return undefined;
  const parsed = parse(trimmed, NBOS_MONTH_STORAGE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function parseDatetimeLocalValue(value: string | undefined | null): Date | undefined {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return undefined;
  const parsed = parseISO(trimmed);
  return isValid(parsed) ? parsed : undefined;
}

export function formatDatetimeLocalValue(date: Date | undefined): string {
  if (!date || !isValid(date)) return '';
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function formatDateDisplay(
  date: Date | undefined,
  locale: string,
  withTime = false,
): string {
  if (!date || !isValid(date)) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

/** Short label for compact inline date buttons (no year). */
export function formatDateDisplayShort(date: Date | undefined, locale: string): string {
  if (!date || !isValid(date)) return '';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
}
