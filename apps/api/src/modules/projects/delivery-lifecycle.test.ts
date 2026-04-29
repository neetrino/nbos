import { describe, expect, it } from 'vitest';
import {
  buildExtensionDeliveryLifecycle,
  buildProductDeliveryLifecycle,
} from './delivery-lifecycle';

describe('delivery lifecycle projection', () => {
  it('maps legacy product starting statuses to canonical Starting', () => {
    expect(buildProductDeliveryLifecycle({ status: 'NEW' })).toMatchObject({
      entityKind: 'PRODUCT',
      legacyStatus: 'NEW',
      stage: 'STARTING',
      workStatus: 'ACTIVE',
      resolution: null,
      isActive: true,
      isTerminal: false,
    });
    expect(buildProductDeliveryLifecycle({ status: 'CREATING' }).stage).toBe('STARTING');
  });

  it('maps active and terminal extension statuses without changing stored status', () => {
    expect(buildExtensionDeliveryLifecycle({ status: 'QA' })).toMatchObject({
      entityKind: 'EXTENSION',
      legacyStatus: 'QA',
      stage: 'QA',
      workStatus: 'ACTIVE',
      resolution: null,
    });
    expect(buildExtensionDeliveryLifecycle({ status: 'LOST' })).toMatchObject({
      stage: null,
      resolution: 'CANCELLED',
      isActive: false,
      isTerminal: true,
    });
  });

  it('projects legacy product On Hold as pause status outside the stage pipeline', () => {
    expect(buildProductDeliveryLifecycle({ status: 'ON_HOLD' })).toEqual({
      entityKind: 'PRODUCT',
      legacyStatus: 'ON_HOLD',
      stage: null,
      workStatus: 'ON_HOLD',
      resolution: null,
      isActive: true,
      isTerminal: false,
    });
  });
});
