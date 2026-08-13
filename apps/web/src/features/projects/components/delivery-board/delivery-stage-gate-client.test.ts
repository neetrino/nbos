import { describe, expect, it } from 'vitest';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  getLocalDeliveryCompleteErrors,
  getLocalDeliveryMoveNextErrors,
  getLocalDeliveryMoveStageErrors,
} from './delivery-stage-gate-client';
import type { DeliveryBoardItem } from './project-delivery-board-model';

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

function productItem(
  overrides: Partial<Extract<DeliveryBoardItem, { kind: 'PRODUCT' }>['product']> = {},
): DeliveryBoardItem {
  return {
    kind: 'PRODUCT',
    product: {
      id: 'p1',
      name: 'Site',
      status: 'CREATING',
      productCategory: 'DEV',
      productType: 'WEBSITE',
      deadline: null,
      description: null,
      clientAcceptedAt: null,
      order: null,
      pm: null,
      projectId: 'proj',
      deliveryLifecycle: lc({ stage: 'STARTING' }),
      _count: { extensions: 0, tasks: 0, tickets: 0 },
      ...overrides,
    },
  };
}

describe('getLocalDeliveryMoveStageErrors', () => {
  it('returns task errors when open work items block DEVELOPMENT → QA', () => {
    const errors = getLocalDeliveryMoveStageErrors(
      productItem({
        status: 'DEVELOPMENT',
        deliveryLifecycle: lc({ stage: 'DEVELOPMENT' }),
        _count: { extensions: 0, tasks: 2, tickets: 0 },
      }),
      'QA',
    );
    expect(errors.some((e) => e.field === 'tasks')).toBe(true);
  });

  it('returns empty when DEVELOPMENT → QA has no open tasks (heuristic)', () => {
    const errors = getLocalDeliveryMoveStageErrors(
      productItem({
        status: 'DEVELOPMENT',
        deliveryLifecycle: lc({ stage: 'DEVELOPMENT' }),
        _count: { extensions: 0, tasks: 0, tickets: 0 },
      }),
      'QA',
    );
    expect(errors).toEqual([]);
  });
});

describe('getLocalDeliveryMoveNextErrors', () => {
  it('maps DEVELOPMENT to QA gate when tasks count is positive', () => {
    const errors = getLocalDeliveryMoveNextErrors(
      productItem({
        status: 'DEVELOPMENT',
        deliveryLifecycle: lc({ stage: 'DEVELOPMENT' }),
        _count: { extensions: 0, tasks: 1, tickets: 0 },
      }),
    );
    expect(errors.some((e) => e.field === 'tasks')).toBe(true);
  });
});

describe('getLocalDeliveryCompleteErrors', () => {
  it('requires acceptance fields before DONE', () => {
    const errors = getLocalDeliveryCompleteErrors(productItem());
    expect(errors.length).toBeGreaterThan(0);
  });

  it('regression: allows complete when a subscription order is PARTIALLY_PAID and invoices are paid', () => {
    const errors = getLocalDeliveryCompleteErrors(
      productItem({
        status: 'TRANSFER',
        clientAcceptedAt: '2026-04-29T09:00:00.000Z',
        deliveryLifecycle: lc({ stage: 'TRANSFER' }),
        order: {
          id: 'ord-1',
          status: 'PARTIALLY_PAID',
          paymentType: 'SUBSCRIPTION',
          invoices: [{ moneyStatus: 'PAID' }],
        },
      }),
    );
    expect(errors).toEqual([]);
  });
});
