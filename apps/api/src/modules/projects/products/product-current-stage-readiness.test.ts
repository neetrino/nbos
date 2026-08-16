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
        paymentType: 'CLASSIC',
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

  it('does not treat TRANSFER as finance-ready when a CLASSIC order is PARTIALLY_PAID', () => {
    const p = {
      ...baseProduct,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      clientAcceptedAt: new Date(),
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'CLASSIC',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toEqual({
      completed: 5,
      total: 6,
    });
  });

  it('regression: subscription TRANSFER readiness is complete when the order stays PARTIALLY_PAID and no invoices are unpaid', () => {
    const p = {
      ...baseProduct,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      clientAcceptedAt: new Date(),
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'SUBSCRIPTION',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toEqual({
      completed: 6,
      total: 6,
    });
  });

  it('still blocks TRANSFER readiness when a subscription order has an unpaid invoice', () => {
    const p = {
      ...baseProduct,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      clientAcceptedAt: new Date(),
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'SUBSCRIPTION',
        invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
      },
    };
    const lc = buildProductDeliveryLifecycle(p);
    expect(buildProductCurrentStageReadiness(p, lc, zeroOpen())).toEqual({
      completed: 5,
      total: 6,
    });
  });
});

function zeroOpen() {
  return { openTasks: 0, openTickets: 0, openExtensions: 0 };
}
