/** Company payroll calendar when no company timezone is configured (Q-40 fallback). */
export const PAYROLL_CALENDAR_TIME_ZONE = 'Asia/Yerevan';

/** Asia/Yerevan has no DST; used only to bound calendar months, not to relabel stored months. */
const PAYROLL_CALENDAR_UTC_OFFSET = '+04:00';

const PAYROLL_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const UNBOUNDED_PAYROLL_MONTH = '9999-12';

export interface PayrollMonthRange {
  from: string;
  to: string | null;
}

export function parsePayrollMonthParts(payrollMonth: string): { year: number; month: number } {
  const match = PAYROLL_MONTH_PATTERN.exec(payrollMonth);
  const year = Number.parseInt(match?.[1] ?? '', 10);
  const month = Number.parseInt(match?.[2] ?? '', 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error(`Invalid payrollMonth: ${payrollMonth}`);
  }
  return { year, month };
}

/** Last instant of the payroll month in Asia/Yerevan (YYYY-MM). */
export function endOfPayrollMonthUtc(payrollMonth: string): Date {
  const { year, month } = parsePayrollMonthParts(payrollMonth);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return yerevanDateTime(year, month, lastDay, '23:59:59.999');
}

/** First instant of the payroll month in Asia/Yerevan (YYYY-MM). */
export function startOfPayrollMonthUtc(payrollMonth: string): Date {
  const { year, month } = parsePayrollMonthParts(payrollMonth);
  return yerevanDateTime(year, month, 1, '00:00:00.000');
}

/** YYYY-MM of an instant in the payroll calendar timezone. */
export function payrollMonthForInstant(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PAYROLL_CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(instant);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  if (year == null || month == null) {
    throw new Error('Unable to resolve payroll month for instant');
  }
  return `${year}-${month}`;
}

export function previousPayrollMonth(payrollMonth: string): string {
  const { year, month } = parsePayrollMonthParts(payrollMonth);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

/** UTC midnight of the last calendar day of the payroll month (DATE column). */
export function lastDateOfPayrollMonth(payrollMonth: string): Date {
  const { year, month } = parsePayrollMonthParts(payrollMonth);
  return new Date(Date.UTC(year, month, 0));
}

export function payrollMonthRangeOf(
  effectiveFrom: Date,
  effectiveTo: Date | null,
): PayrollMonthRange {
  return {
    from: payrollMonthForInstant(effectiveFrom),
    to: effectiveTo == null ? null : payrollMonthForInstant(effectiveTo),
  };
}

export function payrollMonthRangesOverlap(
  left: PayrollMonthRange,
  right: PayrollMonthRange,
): boolean {
  const leftEnd = left.to ?? UNBOUNDED_PAYROLL_MONTH;
  const rightEnd = right.to ?? UNBOUNDED_PAYROLL_MONTH;
  return left.from <= rightEnd && right.from <= leftEnd;
}

export function approvedProfileCoversPayrollMonth(
  profile: { effectiveFrom: Date; effectiveTo: Date | null },
  payrollMonth: string,
): boolean {
  const monthStart = startOfPayrollMonthUtc(payrollMonth);
  const monthEnd = endOfPayrollMonthUtc(payrollMonth);
  return (
    profile.effectiveFrom <= monthEnd &&
    (profile.effectiveTo == null || profile.effectiveTo >= monthStart)
  );
}

function yerevanDateTime(year: number, month: number, day: number, time: string): Date {
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T${time}${PAYROLL_CALENDAR_UTC_OFFSET}`);
}
