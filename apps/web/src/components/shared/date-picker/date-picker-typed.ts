import { startOfDay } from 'date-fns';
import {
  NBOS_TYPED_DATE_TWO_DIGIT_YEAR_BASE,
  NBOS_TYPED_DATE_YEAR_MAX,
  NBOS_TYPED_DATE_YEAR_MIN,
} from './date-picker-constants';

export type TypedDatePartKey = 'day' | 'month' | 'year';
export type TypedDateParts = Record<TypedDatePartKey, string>;

export const EMPTY_TYPED_DATE_PARTS: TypedDateParts = { day: '', month: '', year: '' };

export const TYPED_DATE_PART_ORDER: TypedDatePartKey[] = ['day', 'month', 'year'];

export const TYPED_DATE_PART_MAX: Record<TypedDatePartKey, number> = {
  day: 2,
  month: 2,
  year: 4,
};

const TYPED_DATE_DAY_AUTO_ADVANCE_FROM = 4;
const TYPED_DATE_MONTH_AUTO_ADVANCE_FROM = 2;
const TYPED_DATE_YEAR_SHORT_LENGTH = 2;
const TYPED_DATE_YEAR_FULL_LENGTH = 4;

export function formatTypedDateParts(date: Date): TypedDateParts {
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}

export function parseTypedDateParts(parts: TypedDateParts): Date | undefined {
  if (!parts.day || !parts.month || !parts.year) return undefined;
  if (
    parts.year.length !== TYPED_DATE_YEAR_SHORT_LENGTH &&
    parts.year.length !== TYPED_DATE_YEAR_FULL_LENGTH
  ) {
    return undefined;
  }

  const day = Number(parts.day);
  const month = Number(parts.month);
  const yearPart = Number(parts.year);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(yearPart)) {
    return undefined;
  }

  return buildValidDate(day, month, expandTypedYear(yearPart));
}

export function sanitizeTypedDatePart(part: TypedDatePartKey, raw: string): string {
  return raw.replace(/\D/g, '').slice(0, TYPED_DATE_PART_MAX[part]);
}

export function shouldAdvanceTypedDatePart(part: TypedDatePartKey, digits: string): boolean {
  if (part === 'year') return digits.length === TYPED_DATE_YEAR_FULL_LENGTH;
  if (digits.length === TYPED_DATE_PART_MAX[part]) return true;
  if (digits.length !== 1) return false;
  const value = Number(digits);
  return part === 'day'
    ? value >= TYPED_DATE_DAY_AUTO_ADVANCE_FROM
    : value >= TYPED_DATE_MONTH_AUTO_ADVANCE_FROM;
}

export function adjacentTypedDatePart(
  part: TypedDatePartKey,
  direction: -1 | 1,
): TypedDatePartKey | undefined {
  const index = TYPED_DATE_PART_ORDER.indexOf(part) + direction;
  return TYPED_DATE_PART_ORDER[index];
}

function expandTypedYear(year: number): number {
  if (year >= 0 && year < 100) return NBOS_TYPED_DATE_TWO_DIGIT_YEAR_BASE + year;
  return year;
}

function buildValidDate(day: number, month: number, year: number): Date | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  if (year < NBOS_TYPED_DATE_YEAR_MIN || year > NBOS_TYPED_DATE_YEAR_MAX) return undefined;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return startOfDay(date);
}
