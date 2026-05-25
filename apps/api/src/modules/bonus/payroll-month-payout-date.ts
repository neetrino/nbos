import { BadRequestException } from '@nestjs/common';

import { parsePayrollMonthToUtcRange } from '../payroll-runs/payroll-run-suggested-sales-actual';
import { PAYROLL_MONTH_REGEX } from '../payroll-runs/payroll-runs.constants';

/** First day of payroll month (UTC), stored on `BonusEntry.payoutMonth`. */
export function payrollMonthToPayoutDate(payrollMonth: string): Date {
  const month = payrollMonth.trim();
  if (!PAYROLL_MONTH_REGEX.test(month)) {
    throw new BadRequestException('payrollMonth must be YYYY-MM');
  }
  const range = parsePayrollMonthToUtcRange(month);
  if (range == null) {
    throw new BadRequestException('payrollMonth must be YYYY-MM');
  }
  return range.gte;
}
