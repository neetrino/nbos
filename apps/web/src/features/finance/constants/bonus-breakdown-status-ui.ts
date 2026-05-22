import type { StatusVariant } from '@/components/shared/StatusBadge';

export type BonusPolicyBreakdownStatus = 'INCOMING' | 'BURNED' | 'CARRY_OVER' | 'CLAWBACK';

export const BONUS_BREAKDOWN_STATUS_LABEL: Record<BonusPolicyBreakdownStatus, string> = {
  INCOMING: 'Incoming',
  BURNED: 'Burned KPI',
  CARRY_OVER: 'Carry-over',
  CLAWBACK: 'Clawback',
};

export const BONUS_BREAKDOWN_STATUS_VARIANT: Record<BonusPolicyBreakdownStatus, StatusVariant> = {
  INCOMING: 'blue',
  BURNED: 'red',
  CARRY_OVER: 'amber',
  CLAWBACK: 'gray',
};
