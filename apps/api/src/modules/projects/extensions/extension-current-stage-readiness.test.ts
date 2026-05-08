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
      invoices: [{ moneyStatus: 'PAID' }],
    },
  };

  it('returns undefined when terminal', () => {
    const lc = buildExtensionDeliveryLifecycle({ ...base, status: 'DONE' });
    expect(buildExtensionCurrentStageReadiness(base, lc, { openTasks: 0 })).toBeUndefined();
  });

  it('STARTING counts three fields', () => {
    const ext = { ...base, status: 'NEW' };
    const lc = buildExtensionDeliveryLifecycle(ext);
    expect(buildExtensionCurrentStageReadiness(ext, lc, { openTasks: 0 })).toEqual({
      completed: 3,
      total: 3,
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
});
