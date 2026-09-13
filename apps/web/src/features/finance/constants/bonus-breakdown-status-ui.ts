import type { StatusVariant } from '@/components/shared/StatusBadge';

export type BonusPolicyBreakdownStatus = 'INCOMING' | 'BURNED' | 'CARRY_OVER' | 'CLAWBACK';

/** English fallback labels; prefer `BONUS_BREAKDOWN_STATUS_MESSAGE_KEY` at render. */
export const BONUS_BREAKDOWN_STATUS_LABEL: Record<BonusPolicyBreakdownStatus, string> = {
  INCOMING: 'Incoming',
  BURNED: 'Burned KPI',
  CARRY_OVER: 'Carry-over',
  CLAWBACK: 'Clawback',
};

export const BONUS_BREAKDOWN_STATUS_MESSAGE_KEY: Record<
  BonusPolicyBreakdownStatus,
  | 'compensation.bonus.breakdownStatus.INCOMING'
  | 'compensation.bonus.breakdownStatus.BURNED'
  | 'compensation.bonus.breakdownStatus.CARRY_OVER'
  | 'compensation.bonus.breakdownStatus.CLAWBACK'
> = {
  INCOMING: 'compensation.bonus.breakdownStatus.INCOMING',
  BURNED: 'compensation.bonus.breakdownStatus.BURNED',
  CARRY_OVER: 'compensation.bonus.breakdownStatus.CARRY_OVER',
  CLAWBACK: 'compensation.bonus.breakdownStatus.CLAWBACK',
};

export const BONUS_BREAKDOWN_STATUS_VARIANT: Record<BonusPolicyBreakdownStatus, StatusVariant> = {
  INCOMING: 'blue',
  BURNED: 'red',
  CARRY_OVER: 'amber',
  CLAWBACK: 'gray',
};
