import { describe, expect, it } from 'vitest';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  applyDeliveryBoardActiveFilters,
  buildActiveFilterOptions,
  type DeliveryBoardActiveFiltersInput,
} from './delivery-board-active-filters';
import type { DeliveryBoardItem } from './project-delivery-board-model';

function activeLc(partial: Partial<DeliveryLifecycleProjection>): DeliveryLifecycleProjection {
  return {
    entityKind: 'PRODUCT',
    legacyStatus: null,
    stage: 'DEVELOPMENT',
    workStatus: 'ACTIVE',
    resolution: null,
    onHoldReason: null,
    onHoldUntil: null,
    cancellationReason: null,
    isActive: true,
    isTerminal: false,
    ...partial,
  };
}

const productDev: DeliveryBoardItem = {
  kind: 'PRODUCT',
  product: {
    id: 'prod-1',
    name: 'Logistics Store',
    status: 'IN_PROGRESS',
    productCategory: 'DEV',
    productType: 'WEBSITE',
    deadline: null,
    pm: { id: 'pm-1', firstName: 'Sam', lastName: 'Lee' },
    deliveryLifecycle: activeLc({ stage: 'DEVELOPMENT' }),
    projectId: 'proj-1',
    project: {
      id: 'proj-1',
      name: 'Acme Logistics',
      code: 'P-2026-0001',
      companyId: 'co-1',
      company: { id: 'co-1', name: 'Acme Corp' },
    },
    _count: { extensions: 0, tasks: 0, tickets: 0 },
  },
};

const productOtherPm: DeliveryBoardItem = {
  kind: 'PRODUCT',
  product: {
    ...productDev.product,
    id: 'prod-2',
    name: 'Other Product',
    pm: { id: 'pm-2', firstName: 'Alex', lastName: 'Kim' },
    project: {
      id: 'proj-2',
      name: 'Other Co',
      code: 'P-2026-0099',
      companyId: 'co-2',
      company: { id: 'co-2', name: 'Other LLC' },
    },
    projectId: 'proj-2',
    deliveryLifecycle: activeLc({ stage: 'QA' }),
  },
};

const baseActiveFilters: DeliveryBoardActiveFiltersInput = {
  search: '',
  ownerId: '',
  workStatus: 'ALL',
};

describe('applyDeliveryBoardActiveFilters', () => {
  it('filters by search on project code', () => {
    const out = applyDeliveryBoardActiveFilters([productDev, productOtherPm], {
      ...baseActiveFilters,
      search: 'P-2026-0001',
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toBe(productDev);
  });

  it('filters by owner id', () => {
    const out = applyDeliveryBoardActiveFilters([productDev, productOtherPm], {
      ...baseActiveFilters,
      ownerId: 'pm-2',
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toBe(productOtherPm);
  });

  it('filters by work status on hold', () => {
    const onHold: DeliveryBoardItem = {
      kind: 'PRODUCT',
      product: {
        ...productDev.product,
        id: 'prod-h',
        deliveryLifecycle: activeLc({ workStatus: 'ON_HOLD', stage: 'STARTING' }),
      },
    };
    const out = applyDeliveryBoardActiveFilters([productDev, onHold], {
      ...baseActiveFilters,
      workStatus: 'ON_HOLD',
    });
    expect(out).toEqual([onHold]);
  });
});

describe('buildActiveFilterOptions', () => {
  it('collects owners from active pipeline items', () => {
    const opts = buildActiveFilterOptions([productDev, productOtherPm]);
    expect(opts.owners.map((o) => o.id).sort()).toEqual(['pm-1', 'pm-2']);
  });
});
