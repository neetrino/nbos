import { addDays, isSaturday, isSunday, startOfDay } from 'date-fns';

/** Next calendar day that falls on Monday–Friday (local timezone). */
export function getNextBusinessDay(from: Date = new Date()): Date {
  let cursor = startOfDay(addDays(from, 1));
  while (isSaturday(cursor) || isSunday(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}
