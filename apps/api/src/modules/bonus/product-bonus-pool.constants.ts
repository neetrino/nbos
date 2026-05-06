import type { BonusReleaseStatusEnum, BonusTypeEnum } from '@nbos/database';

/** Release rows that count toward pool `totalReleasedAmount` and funding caps. */
export const BONUS_RELEASE_COUNTING_STATUSES: BonusReleaseStatusEnum[] = [
  'APPROVED',
  'INCLUDED_IN_PAYROLL',
  'PAID',
];

/** Delivery-side bonus rows eligible for proportional auto-release (NBOS § Subscription Product Bonus Release). */
export const DELIVERY_AUTO_RELEASE_BONUS_TYPES: BonusTypeEnum[] = ['DELIVERY', 'PM', 'DESIGN'];
