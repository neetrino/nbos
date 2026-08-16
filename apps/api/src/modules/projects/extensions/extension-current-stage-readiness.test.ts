import { describe, expect, it } from 'vitest';
import { buildExtensionDeliveryLifecycle } from '../delivery-lifecycle';
import { buildExtensionCurrentStageReadiness } from './extension-current-stage-readiness';

describe('buildExtensionCurrentStageReadiness', () => {
  const base = {
    status: 'DEVELOPMENT',
    description: 'x',
    assignedTo: 'e1',
    order: {
      id: 'ord-1',
      status: 'FULLY_PAID',
      paymentType: 'CLASSIC',
      invoices: [{ moneyStatus: 'PAID' }],
    },
  };

  it('returns undefined when terminal', () => {
    const lc = buildExtensionDeliveryLifecycle({ ...base, status: 'DONE' });
    expect(buildExtensionCurrentStageReadiness(base, lc, { openTasks: 0 })).toBeUndefined();
  });

  it('STARTING counts scope and owner', () => {
    const ext = { ...base, status: 'NEW' };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc, { openTasks: 0 })).toEqual({
      completed: 2,
      total: 2,
    });
  });

  it('TRANSFER uses three checks', () => {
    const ext = {
      ...base,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
    };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc, { openTasks: 0 })).toEqual({
      completed: 3,
      total: 3,
    });
  });

  it('does not treat TRANSFER as finance-ready when a CLASSIC order is PARTIALLY_PAID', () => {
    const ext = {
      ...base,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'CLASSIC',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc, { openTasks: 0 })).toEqual({
      completed: 2,
      total: 3,
    });
  });

  it('regression: subscription TRANSFER readiness is complete when the order stays PARTIALLY_PAID and no invoices are unpaid', () => {
    const ext = {
      ...base,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'SUBSCRIPTION',
        invoices: [{ moneyStatus: 'PAID' }],
      },
    };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc, { openTasks: 0 })).toEqual({
      completed: 3,
      total: 3,
    });
  });

  it('still blocks TRANSFER readiness when a subscription order has an unpaid invoice', () => {
    const ext = {
      ...base,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
      order: {
        id: 'ord-1',
        status: 'PARTIALLY_PAID',
        paymentType: 'SUBSCRIPTION',
        invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
      },
    };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc, { openTasks: 0 })).toEqual({
      completed: 2,
      total: 3,
    });
  });
});
