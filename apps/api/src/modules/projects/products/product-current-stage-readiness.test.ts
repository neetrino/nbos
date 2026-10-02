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

  it('STARTING counts deadline', () => {
    const p = { ...baseProduct, status: 'NEW', deliveryStage: 'STARTING' as const };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toEqual({
      completed: 1,
      total: 1,
    });
  });

  it('DEVELOPMENT ignores open tasks', () => {
    const p = { ...baseProduct, status: 'DEVELOPMENT', deliveryStage: 'DEVELOPMENT' as const };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toBeUndefined();
  });

  it('TRANSFER uses delivery checks other than tasks and ignores finance', () => {
    const p = {
      ...baseProduct,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      clientAcceptedAt: new Date(),
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'CLASSIC',
        invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
      },
    };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toEqual({
      completed: 3,
      total: 3,
    });
  });
});

function zeroOpen() {
  return { openTickets: 0, openExtensions: 0 };
}
