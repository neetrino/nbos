import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';

export const SALARY_BOARD_PAYOUT_PHASE_HEX: Record<CompensationPayoutPhase, string> = {
  accumulating: '#6B7280',
  active_payout: '#EA580C',
  past_paid: '#16A34A',
};

/** Left-to-right kanban order (workflow: building → paying → done). */
export const SALARY_BOARD_KANBAN_PHASE_ORDER: readonly CompensationPayoutPhase[] = [
  'accumulating',
  'active_payout',
  'past_paid',
] as const;
