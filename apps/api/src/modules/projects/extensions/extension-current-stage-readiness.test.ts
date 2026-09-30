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
    expect(buildExtensionCurrentStageReadiness(base, lc)).toBeUndefined();
  });

  it('STARTING counts scope and owner', () => {
    const ext = { ...base, status: 'NEW' };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc)).toEqual({
      completed: 2,
      total: 2,
    });
  });

  it('TRANSFER ignores open tasks and finance', () => {
    const ext = {
      ...base,
      status: 'TRANSFER',
      deliveryStage: 'TRANSFER' as const,
    };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc)).toBeUndefined();
  });
});
