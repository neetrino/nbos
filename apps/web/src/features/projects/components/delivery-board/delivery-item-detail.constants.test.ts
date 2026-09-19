import { describe, expect, it } from 'vitest';
import { DELIVERY_DETAIL_TABS } from './delivery-item-detail.constants';

describe('DELIVERY_DETAIL_TABS', () => {
  it('replaces bonus with functions', () => {
    const ids = DELIVERY_DETAIL_TABS.map((tab) => tab.id);
    expect(ids).toContain('functions');
    expect(ids).not.toContain('bonus');
  });
});
