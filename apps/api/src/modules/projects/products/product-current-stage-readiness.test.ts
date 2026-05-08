import { describe, expect, it } from 'vitest';
import { buildProductDeliveryLifecycle } from '../delivery-lifecycle';
import { buildProductCurrentStageReadiness } from './product-current-stage-readiness';

describe('buildProductCurrentStageReadiness', () => {
  const baseProduct = {
    status: 'DEVELOPMENT',
    description: 'x',
    deadline: new Date(),
    clientAcceptedAt: null,
    order: {
      id: 'ord-1',
      status: 'ACTIVE',
      invoices: [{ moneyStatus: 'PAID' }],
    },
  };

  it('returns undefined when terminal', () => {
    const lc = buildProductDeliveryLifecycle({ ...baseProduct, status: 'DONE' });
    expect(buildProductCurrentStageReadiness(baseProduct, lc, zeroOpen())).toBeUndefined();
  });

  it('STARTING counts description, deadline, order', () => {
    const p = { ...baseProduct, status: 'NEW', deliveryStage: 'STARTING' as const };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toEqual({
      completed: 3,
      total: 3,
    });
  });

  it('DEVELOPMENT is 1/1 when no open tasks', () => {
    const p = { ...baseProduct, status: 'DEVELOPMENT', deliveryStage: 'DEVELOPMENT' as const };
    const lc = buildProductDeliveryLifecycle(p);
    expect(
      buildProductCurrentStageReadiness(p, lc, {
        openTasks: 0,
        openTickets: 0,
        openExtensions: 0,
      }),
    ).toEqual({ completed: 1, total: 1 });
  });

  it('TRANSFER uses six checks', () => {
    const p = {
      ...baseProduct,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      clientAcceptedAt: new Date(),
      order: {
        id: 'ord-1',
        status: 'FULLY_PAID',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    };
    const lc = buildProductDeliveryLifecycle(p);
    expect(
      buildProductCurrentStageReadiness(p, lc, {
        openTasks: 0,
        openTickets: 0,
        openExtensions: 0,
      }),
    ).toEqual({ completed: 6, total: 6 });
  });
});

function zeroOpen() {
  return { openTasks: 0, openTickets: 0, openExtensions: 0 };
}
