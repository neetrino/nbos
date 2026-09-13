import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { CompensationPayoutPhase } from '@/lib/api/payroll-runs';

export const COMPENSATION_PAYOUT_PHASE_LABEL_KEY = {
  past_paid: 'payoutPhase.past_paid',
  active_payout: 'payoutPhase.active_payout',
  accumulating: 'payoutPhase.accumulating',
} as const satisfies Record<CompensationPayoutPhase, string>;

export const COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY = {
  past_paid: 'compensation.payoutPhaseDescription.past_paid',
  active_payout: 'compensation.payoutPhaseDescription.active_payout',
  accumulating: 'compensation.payoutPhaseDescription.accumulating',
} as const satisfies Record<CompensationPayoutPhase, string>;

export const COMPENSATION_PAYOUT_PHASE_UI: Record<
  CompensationPayoutPhase,
  {
    labelKey: (typeof COMPENSATION_PAYOUT_PHASE_LABEL_KEY)[CompensationPayoutPhase];
    descriptionKey: (typeof COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY)[CompensationPayoutPhase];
    variant: StatusVariant;
    hex: string;
  }
> = {
  past_paid: {
    labelKey: COMPENSATION_PAYOUT_PHASE_LABEL_KEY.past_paid,
    descriptionKey: COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY.past_paid,
    variant: 'green',
    hex: '#16A34A',
  },
  active_payout: {
    labelKey: COMPENSATION_PAYOUT_PHASE_LABEL_KEY.active_payout,
    descriptionKey: COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY.active_payout,
    variant: 'orange',
    hex: '#EA580C',
  },
  accumulating: {
    labelKey: COMPENSATION_PAYOUT_PHASE_LABEL_KEY.accumulating,
    descriptionKey: COMPENSATION_PAYOUT_PHASE_DESCRIPTION_KEY.accumulating,
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
