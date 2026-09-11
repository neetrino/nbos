import { describe, expect, it } from 'vitest';
import {
  isProductOnMaintenance,
  productNotOnMaintenanceWhere,
  productOnMaintenanceWhere,
} from './product-maintenance-view';

describe('product maintenance view (Hub formula)', () => {
  it('is true for MAINTENANCE_ONLY or DEV_AND_MAINTENANCE with PENDING or ACTIVE', () => {
    const live = [
      { type: 'MAINTENANCE_ONLY', status: 'ACTIVE' },
      { type: 'MAINTENANCE_ONLY', status: 'PENDING' },
      { type: 'DEV_AND_MAINTENANCE', status: 'ACTIVE' },
      { type: 'DEV_AND_MAINTENANCE', status: 'PENDING' },
    ];
    for (const subscription of live) {
      expect(isProductOnMaintenance([subscription])).toBe(true);
    }
  });

  it('is false for ON_HOLD, CANCELLED, or COMPLETED maintenance subscriptions', () => {
    const off = [
      { type: 'MAINTENANCE_ONLY', status: 'ON_HOLD' },
      { type: 'MAINTENANCE_ONLY', status: 'CANCELLED' },
      { type: 'MAINTENANCE_ONLY', status: 'COMPLETED' },
      { type: 'DEV_AND_MAINTENANCE', status: 'ON_HOLD' },
      { type: 'DEV_AND_MAINTENANCE', status: 'CANCELLED' },
      { type: 'DEV_AND_MAINTENANCE', status: 'COMPLETED' },
    ];
    for (const subscription of off) {
      expect(isProductOnMaintenance([subscription])).toBe(false);
    }
  });

  it('is false for DEV_ONLY ACTIVE and for no subscriptions', () => {
    expect(isProductOnMaintenance([{ type: 'DEV_ONLY', status: 'ACTIVE' }])).toBe(false);
    expect(isProductOnMaintenance([])).toBe(false);
  });

  it('exposes the same formula as Prisma some/none filters', () => {
    const filter = {
      type: { in: ['MAINTENANCE_ONLY', 'DEV_AND_MAINTENANCE'] },
      status: { in: ['PENDING', 'ACTIVE'] },
    };
    expect(productOnMaintenanceWhere()).toEqual({ subscriptions: { some: filter } });
    expect(productNotOnMaintenanceWhere()).toEqual({ subscriptions: { none: filter } });
  });
});
