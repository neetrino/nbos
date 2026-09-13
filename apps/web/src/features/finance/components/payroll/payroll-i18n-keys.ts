import type { CompensationPayoutPhase, SalaryLineStatus } from '@/lib/api/payroll-runs';

export const SALARY_LINE_STATUS_MESSAGE_KEY: Record<
  SalaryLineStatus,
  | 'lineStatus.PENDING'
  | 'lineStatus.APPROVED'
  | 'lineStatus.PARTIALLY_PAID'
  | 'lineStatus.PAID'
  | 'lineStatus.HELD'
> = {
  PENDING: 'lineStatus.PENDING',
  APPROVED: 'lineStatus.APPROVED',
  PARTIALLY_PAID: 'lineStatus.PARTIALLY_PAID',
  PAID: 'lineStatus.PAID',
  HELD: 'lineStatus.HELD',
};

export const PAYOUT_PHASE_MESSAGE_KEY: Record<
  CompensationPayoutPhase,
  'payoutPhase.past_paid' | 'payoutPhase.active_payout' | 'payoutPhase.accumulating'
> = {
  past_paid: 'payoutPhase.past_paid',
  active_payout: 'payoutPhase.active_payout',
  accumulating: 'payoutPhase.accumulating',
};
