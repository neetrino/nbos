import type { PayrollRunStatusEnum } from '@nbos/database';

const ALLOWED: Record<PayrollRunStatusEnum, PayrollRunStatusEnum[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['PAYING'],
  PAYING: ['CLOSED'],
  CLOSED: [],
};

export function canTransitionPayrollRun(
  from: PayrollRunStatusEnum,
  to: PayrollRunStatusEnum,
): boolean {
  return ALLOWED[from].includes(to);
}
