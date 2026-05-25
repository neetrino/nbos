import type { StatusVariant } from '@/components/shared';
import type { BonusReleaseStatus } from '@/lib/api/bonus';

export const BONUS_RELEASE_STATUS_LABEL: Record<BonusReleaseStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  INCLUDED_IN_PAYROLL: 'In payroll',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const BONUS_RELEASE_STATUS_VARIANT: Record<BonusReleaseStatus, StatusVariant> = {
  DRAFT: 'gray',
  APPROVED: 'blue',
  INCLUDED_IN_PAYROLL: 'purple',
  PAID: 'green',
  CANCELLED: 'red',
};

export function bonusReleaseIsAdjustable(status: BonusReleaseStatus): boolean {
  return status === 'APPROVED' || status === 'DRAFT';
}
