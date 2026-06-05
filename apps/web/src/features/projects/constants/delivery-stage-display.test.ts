import { describe, expect, it } from 'vitest';
import { getProductDeliveryStageBadgeDisplay } from './delivery-stage-display';

describe('getProductDeliveryStageBadgeDisplay', () => {
  it('uses canonical Starting label for STARTING stage, not legacy Creating', () => {
    expect(
      getProductDeliveryStageBadgeDisplay({
        status: 'CREATING',
        deliveryLifecycle: { stage: 'STARTING', resolution: null },
      }),
    ).toEqual({ label: 'Starting', variant: 'violet' });
  });

  it('maps legacy CREATING status to Starting when lifecycle stage is missing', () => {
    expect(
      getProductDeliveryStageBadgeDisplay({
        status: 'CREATING',
      }),
    ).toEqual({ label: 'Starting', variant: 'violet' });
  });

  it('uses Development for DEVELOPMENT stage even when legacy status is ON_HOLD', () => {
    expect(
      getProductDeliveryStageBadgeDisplay({
        status: 'ON_HOLD',
        deliveryLifecycle: { stage: 'DEVELOPMENT', resolution: null },
      }),
    ).toEqual({ label: 'Development', variant: 'blue' });
  });
});
