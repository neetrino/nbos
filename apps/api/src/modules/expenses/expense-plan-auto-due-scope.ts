/**
 * Month window for expense-plan auto-generation.
 * The company calendar is Asia/Yerevan; plan due dates are stored as UTC midnights of the picked day.
 */

/** Company calendar for “this month” on Pay Now. */
export const EXPENSE_PLAN_AUTO_DUE_TIMEZONE = 'Asia/Yerevan';

/**
 * Weekly catch-up bound for one job run (52 weeks + the next occurrence).
 * A later daily run continues if a plan is still inside the month window.
 */
export const EXPENSE_PLAN_MONTH_CARD_LIMIT = 53;

const YEREVAN_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: EXPENSE_PLAN_AUTO_DUE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Inclusive end of the UTC calendar day for the calendar day of `instant` (23:59:59.999Z). */
export function endOfUtcDayUtc(instant: Date): Date {
  return new Date(
    Date.UTC(
      instant.getUTCFullYear(),
      instant.getUTCMonth(),
      instant.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/**
 * Inclusive cutoff for auto-generate: end of the UTC day of the last calendar day
 * in the Asia/Yerevan month that contains `instant`.
 * Overdue dates from earlier months are included; the next month is not.
 */
export function endOfYerevanMonthUtc(instant: Date): Date {
  const [yearText, monthText] = YEREVAN_DATE_FORMATTER.format(instant).split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return endOfUtcDayUtc(new Date(Date.UTC(year, month - 1, lastDay)));
}
