import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';

export const COMPENSATION_PAYOUT_PHASE_UI: Record<
  CompensationPayoutPhase,
  { label: string; description: string; variant: StatusVariant }
> = {
  past_paid: {
    label: 'Paid',
    description: 'Month closed or salary line fully paid.',
    variant: 'green',
  },
  active_payout: {
    label: 'Active payout',
    description: 'Prior month approved — pay via expense card (typically 1–15).',
    variant: 'orange',
  },
  accumulating: {
    label: 'Accumulating',
    description: 'Current or future month — bonuses and salary still building.',
    variant: 'gray',
  },
};
