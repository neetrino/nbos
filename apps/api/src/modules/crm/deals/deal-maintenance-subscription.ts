import type { Prisma } from '@nbos/database';
import { PRODUCT_MAINTENANCE_LIVE_STATUSES } from '../../projects/product-maintenance-view';

/**
 * Maintenance Deal Won idempotency: only a live (`PENDING` / `ACTIVE`) `MAINTENANCE_ONLY`
 * subscription on the product blocks a new one; cancelled / completed / on-hold history does not.
 */
export function liveMaintenanceOnlySubscriptionWhere(
  productId: string,
): Prisma.SubscriptionWhereInput {
  return {
    productId,
    type: 'MAINTENANCE_ONLY',
    status: { in: [...PRODUCT_MAINTENANCE_LIVE_STATUSES] },
  };
}

export const maintenanceSubscriptionHandoffSelect = {
  id: true,
  code: true,
  name: true,
  status: true,
  amount: true,
} as const satisfies Prisma.SubscriptionSelect;
