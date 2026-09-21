import type { DeliveryCompensationRoleKey } from './constants';
import type { DeliveryRoleUnitInput } from './role-units';
import type { DeliveryPlanRateInput } from './calculate-delivery-plan';

/**
 * Synthetic numbers for automated tests only.
 * Do not seed, publish, or show these as production Owner tariffs.
 */
export const SYNTHETIC_TEST_RATES: DeliveryPlanRateInput[] = [
  { roleKey: 'BACKEND', rate: '1000' },
  { roleKey: 'FRONTEND', rate: '800' },
  { roleKey: 'PM', rate: '900' },
  { roleKey: 'DESIGNER', rate: '700' },
  { roleKey: 'QA', rate: '600' },
  { roleKey: 'TECHNICAL_SPECIALIST', rate: '500' },
];

export const SYNTHETIC_TEST_BASE_UNITS: DeliveryRoleUnitInput[] = [
  { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '100' },
  { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '50' },
  { roleKey: 'PM', unitKind: 'REQUIRED', units: '20' },
  { roleKey: 'DESIGNER', unitKind: 'REQUIRED', units: '30' },
  { roleKey: 'QA', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'REQUIRED', units: '5' },
];

export const SYNTHETIC_TEST_WAREHOUSE_UNITS: DeliveryRoleUnitInput[] = [
  { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '10' },
  { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '5' },
  { roleKey: 'QA', unitKind: 'REQUIRED', units: '2' },
  { roleKey: 'PM', unitKind: 'NOT_REQUIRED', units: null },
  { roleKey: 'DESIGNER', unitKind: 'NOT_REQUIRED', units: null },
  { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'NOT_REQUIRED', units: null },
];

export const SYNTHETIC_TEST_BANK_UNITS: DeliveryRoleUnitInput[] = [
  { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '8' },
  { roleKey: 'FRONTEND', unitKind: 'REQUIRED', units: '4' },
  { roleKey: 'PM', unitKind: 'NOT_REQUIRED', units: null },
  { roleKey: 'DESIGNER', unitKind: 'NOT_REQUIRED', units: null },
  { roleKey: 'QA', unitKind: 'NOT_REQUIRED', units: null },
  { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'NOT_REQUIRED', units: null },
];

export const SYNTHETIC_TEST_BASE_TOTAL = '187500.00';
export const SYNTHETIC_TEST_WAREHOUSE_TOTAL = '15200.00';
export const SYNTHETIC_TEST_BASE_PLUS_WAREHOUSE = '202700.00';

export const SYNTHETIC_TEST_BASE_BY_ROLE: Record<DeliveryCompensationRoleKey, string> = {
  BACKEND: '100000.00',
  FRONTEND: '40000.00',
  PM: '18000.00',
  DESIGNER: '21000.00',
  QA: '6000.00',
  TECHNICAL_SPECIALIST: '2500.00',
};
