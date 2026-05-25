import type { PayrollRunStatusEnum, SalaryLineStatusEnum } from '@nbos/database';

export type CompensationPayoutPhase = 'past_paid' | 'active_payout' | 'accumulating';

function utcPayrollMonthNow(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Classifies employee/month compensation for Finance and Wallet cards (NBOS § three card types). */
export function resolveCompensationPayoutPhase(params: {
  payrollMonth: string;
  runStatus: PayrollRunStatusEnum | null;
  lineStatus: SalaryLineStatusEnum | null;
}): CompensationPayoutPhase {
  const { payrollMonth, runStatus, lineStatus } = params;
  const nowMonth = utcPayrollMonthNow();

  if (lineStatus === 'PAID') {
    return 'past_paid';
  }

  if (payrollMonth < nowMonth && runStatus !== null && lineStatus !== null) {
    if (runStatus === 'APPROVED' || runStatus === 'PAYING' || runStatus === 'CLOSED') {
      return 'active_payout';
    }
    if (runStatus === 'DRAFT' || runStatus === 'REVIEW') {
      return 'accumulating';
    }
  }

  if (payrollMonth >= nowMonth) {
    return 'accumulating';
  }

  if (lineStatus === 'PARTIALLY_PAID') {
    return 'active_payout';
  }

  return 'active_payout';
}
