import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import type { PaymentListParams } from '@/lib/api/finance';

export interface BuildPaymentListApiParamsInput {
  search: string;
  period: FinancePeriod;
}

/**
 * Query shape for `GET /api/finance/payments` (excluding paging).
 * Shared by the payments page fetch and CSV export paging.
 */
export function buildPaymentListApiParams(
  input: BuildPaymentListApiParamsInput,
): Omit<PaymentListParams, 'page' | 'pageSize'> {
  const periodParams = getFinancePeriodParams(input.period);
  return {
    search: input.search || undefined,
    ...(periodParams ?? {}),
  };
}
