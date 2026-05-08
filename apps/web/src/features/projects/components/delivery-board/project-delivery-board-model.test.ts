import { describe, expect, it } from 'vitest';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  countDeliveryAggregates,
  getProjectId,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

function lc(partial: Partial<DeliveryLifecycleProjection>): DeliveryLifecycleProjection {
  return {
    entityKind: 'PRODUCT',
    legacyStatus: null,
    stage: 'STARTING',
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

describe('countDeliveryAggregates', () => {
  it('counts active pipeline vs terminal items', () => {
    const items: DeliveryBoardItem[] = [
      {
        kind: 'PRODUCT',
        product: {
          id: 'p1',
          name: 'A',
          status: 'CREATING',
          productCategory: 'DEV',
          productType: 'WEBSITE',
          deadline: null,
          pm: null,
          deliveryLifecycle: lc({ isTerminal: false, isActive: true, stage: 'STARTING' }),
          projectId: 'proj',
          _count: { extensions: 0, tasks: 0, tickets: 0 },
        },
      },
      {
        kind: 'EXTENSION',
        extension: {
          id: 'e1',
          name: 'E',
          status: 'DONE',
          size: 'S',
          productId: 'p1',
          projectId: 'proj',
          assignee: null,
          product: { id: 'p1', name: 'A', productType: 'WEBSITE', status: 'DONE' },
          deliveryLifecycle: lc({
            entityKind: 'EXTENSION',
            isTerminal: true,
            isActive: false,
            stage: null,
            resolution: 'DONE',
          }),
          _count: { tasks: 0 },
        },
      },
    ];
    expect(countDeliveryAggregates(items)).toEqual({ active: 1, closed: 1 });
  });
});

describe('getProjectId', () => {
  it('reads project id from product or extension summaries', () => {
    const productItem: DeliveryBoardItem = {
      kind: 'PRODUCT',
      product: {
        id: 'p',
        name: 'n',
        status: 'X',
        productCategory: 'D',
        productType: 'WEBSITE',
        deadline: null,
        pm: null,
        projectId: 'abc',
        _count: { extensions: 0, tasks: 0, tickets: 0 },
      },
    };
    expect(getProjectId(productItem)).toBe('abc');
  });
});
