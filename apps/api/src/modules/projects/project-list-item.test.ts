import { describe, expect, it } from 'vitest';
import { toProjectListItem } from './project-list-item';

describe('toProjectListItem', () => {
  it('strips probe relations and attaches hubView', () => {
    const result = toProjectListItem({
      id: 'p1',
      trashedAt: null,
      _count: { orders: 0, products: 0, extensions: 0 },
      products: [],
      extensions: [],
      subscriptions: [],
    });
    expect(result).toMatchObject({ id: 'p1', hubView: 'incoming' });
    expect(result).not.toHaveProperty('products');
    expect(result).not.toHaveProperty('subscriptions');
  });
});
