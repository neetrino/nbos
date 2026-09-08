import { describe, expect, it } from 'vitest';
import { productsHubTabToListParams } from './products-hub-directory-query';

describe('productsHubTabToListParams', () => {
  it('classifies All without a hubView filter', () => {
    expect(productsHubTabToListParams('all')).toEqual({ includeHubView: true });
  });

  it('maps computed views and still classifies rows', () => {
    expect(productsHubTabToListParams('delivery')).toEqual({
      hubView: 'delivery',
      includeHubView: true,
    });
    expect(productsHubTabToListParams('maintenance')).toEqual({
      hubView: 'maintenance',
      includeHubView: true,
    });
    expect(productsHubTabToListParams('closed')).toEqual({
      hubView: 'closed',
      includeHubView: true,
    });
  });
});
