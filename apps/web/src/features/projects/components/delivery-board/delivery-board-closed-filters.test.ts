import { describe, expect, it } from 'vitest';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  applyDeliveryBoardClosedFilters,
  type DeliveryBoardClosedFiltersInput,
} from './delivery-board-closed-filters';
import type { DeliveryBoardItem } from './project-delivery-board-model';

function lc(partial: Partial<DeliveryLifecycleProjection>): DeliveryLifecycleProjection {
  return {
    entityKind: 'PRODUCT',
    legacyStatus: null,
    stage: null,
    workStatus: 'ACTIVE',
    resolution: 'DONE',
    onHoldReason: null,
    onHoldUntil: null,
    cancellationReason: null,
    isActive: false,
    isTerminal: true,
    ...partial,
  };
}

const productA: DeliveryBoardItem = {
  kind: 'PRODUCT',
  product: {
    id: 'p1',
    name: 'Alpha Site',
    status: 'DONE',
    productCategory: 'DEV',
    productType: 'WEBSITE',
    deadline: '2026-06-01T00:00:00.000Z',
    pm: { id: 'pm1', firstName: 'Pat', lastName: 'M' },
    deliveryLifecycle: lc({ resolution: 'DONE' }),
    projectId: 'proj1',
    project: { id: 'proj1', name: 'Acme', code: 'ACM' },
    updatedAt: '2026-05-01T12:00:00.000Z',
    clientAcceptedAt: '2026-05-02T00:00:00.000Z',
    _count: { extensions: 0, tasks: 0, tickets: 0 },
  },
};

const extB: DeliveryBoardItem = {
  kind: 'EXTENSION',
  extension: {
    id: 'e1',
    name: 'Add-on',
    status: 'DONE',
    size: 'M',
    productId: 'p1',
    projectId: 'proj2',
    assignee: { id: 'a1', firstName: 'Alex', lastName: 'D' },
    product: { id: 'p1', name: 'Alpha', productType: 'WEBSITE', status: 'DONE' },
    project: { id: 'proj2', name: 'Beta Co', code: 'BET' },
    deliveryLifecycle: lc({ entityKind: 'EXTENSION', resolution: 'CANCELLED' }),
    updatedAt: '2026-05-10T00:00:00.000Z',
    _count: { tasks: 0 },
  },
};

const baseFilters: DeliveryBoardClosedFiltersInput = {
  search: '',
  projectId: '',
  ownerId: '',
  productLineKey: '',
  closedFrom: '',
  closedTo: '',
  deadlineResult: 'ALL',
  result: 'ALL',
};

describe('applyDeliveryBoardClosedFilters', () => {
  it('filters by result and project', () => {
    const items = [productA, extB];
    const r = applyDeliveryBoardClosedFilters(items, {
      ...baseFilters,
      result: 'DONE',
      projectId: 'proj1',
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toBe(productA);
  });

  it('filters by search on name', () => {
    const r = applyDeliveryBoardClosedFilters([productA, extB], {
      ...baseFilters,
      search: 'add-on',
    });
    expect(r).toEqual([extB]);
  });

  it('deadline on time keeps only matching products', () => {
    const r = applyDeliveryBoardClosedFilters([productA, extB], {
      ...baseFilters,
      deadlineResult: 'ON_TIME',
    });
    expect(r).toEqual([productA]);
  });
});
