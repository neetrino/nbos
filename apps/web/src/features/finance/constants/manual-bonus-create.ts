import type { BonusStatus, BonusType } from '@/lib/api/bonus';

/** Statuses Finance can set when creating a bonus manually (excludes Paid / Clawback). */
export const MANUAL_BONUS_CREATE_STATUSES: readonly {
  value: BonusStatus;
  label: string;
}[] = [
  { value: 'INCOMING', label: 'Incoming — forecast' },
  { value: 'EARNED', label: 'Earned' },
  { value: 'VESTED', label: 'Vested — eligible' },
  { value: 'ACTIVE', label: 'Active — ready for payroll' },
];

export const MANUAL_BONUS_DEFAULT_STATUS: BonusStatus = 'ACTIVE';

export const MANUAL_BONUS_TYPE_OPTIONS: readonly { value: BonusType; label: string }[] = [
  { value: 'SALES', label: 'Sales' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'MARKETING', label: 'Marketing / Support' },
  { value: 'PM', label: 'PM' },
  { value: 'DESIGN', label: 'Design' },
];

export const MANUAL_BONUS_ORDERS_PAGE_SIZE = 200;

export const MANUAL_BONUS_EMPLOYEES_PAGE_SIZE = 300;
