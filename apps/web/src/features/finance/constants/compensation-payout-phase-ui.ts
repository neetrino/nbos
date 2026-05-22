import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';

export const COMPENSATION_PAYOUT_PHASE_UI: Record<
  CompensationPayoutPhase,
  { label: string; description: string; variant: StatusVariant; hex: string }
> = {
  past_paid: {
    label: 'Paid',
    description: 'Month closed or salary line fully paid.',
    variant: 'green',
    hex: '#16A34A',
  },
  active_payout: {
    label: 'Active payout',
    description: 'Prior month approved — pay via expense card (typically 1–15).',
    variant: 'orange',
    hex: '#EA580C',
  },
  accumulating: {
    label: 'Accumulating',
    description: 'Current or future month — bonuses and salary still building.',
    variant: 'gray',
    hex: '#6B7280',
  },
};

/** Left-to-right kanban order (workflow: building → paying → done). */
export const SALARY_BOARD_KANBAN_PHASE_ORDER: readonly CompensationPayoutPhase[] = [
  'accumulating',
  'active_payout',
  'past_paid',
] as const;
