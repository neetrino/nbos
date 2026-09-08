import { describe, expect, it } from 'vitest';
import { productsHubEmptyCopy } from './products-hub-empty-copy';

describe('productsHubEmptyCopy', () => {
  it('describes each directory tab', () => {
    expect(productsHubEmptyCopy('all').title).toBe('No products found');
    expect(productsHubEmptyCopy('delivery').title).toBe('No products in delivery');
    expect(productsHubEmptyCopy('maintenance').title).toBe('No products on maintenance');
    expect(productsHubEmptyCopy('closed').title).toBe('No closed products');
  });
});
