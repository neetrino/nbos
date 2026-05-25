import type { StatusVariant } from '@/components/shared';
import type { BonusStatus } from '@/lib/api/bonus';

export const BONUS_ENTRY_STATUS_LABEL: Record<BonusStatus, string> = {
  INCOMING: 'Incoming',
  EARNED: 'Earned',
  PENDING_ELIGIBILITY: 'Pending Eligibility',
  VESTED: 'Vested',
  ACTIVE: 'Active',
  PAID: 'Paid',
  CLAWBACK: 'Clawback',
};

export const BONUS_ENTRY_STATUS_VARIANT: Record<BonusStatus, StatusVariant> = {
  INCOMING: 'gray',
  EARNED: 'blue',
  PENDING_ELIGIBILITY: 'amber',
  VESTED: 'indigo',
  ACTIVE: 'teal',
  PAID: 'green',
  CLAWBACK: 'red',
};

export function isBonusEntryTerminalStatus(status: BonusStatus): boolean {
  return status === 'PAID' || status === 'CLAWBACK';
}
