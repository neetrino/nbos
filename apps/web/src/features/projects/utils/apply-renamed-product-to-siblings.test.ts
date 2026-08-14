import { describe, expect, it } from 'vitest';
import { applyRenamedProductToSiblings } from './apply-renamed-product-to-siblings';

describe('applyRenamedProductToSiblings', () => {
  const siblings = [
    { id: 'p1', name: 'Site', updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'p2', name: 'App', updatedAt: '2026-01-02T00:00:00.000Z' },
  ];

  it('updates only the renamed sibling', () => {
    const next = applyRenamedProductToSiblings(siblings, {
      id: 'p1',
      name: 'Website',
      updatedAt: '2026-08-14T00:00:00.000Z',
    });
    expect(next).toEqual([
      { id: 'p1', name: 'Website', updatedAt: '2026-08-14T00:00:00.000Z' },
      { id: 'p2', name: 'App', updatedAt: '2026-01-02T00:00:00.000Z' },
    ]);
  });

  it('returns equivalent list when id is missing', () => {
    const next = applyRenamedProductToSiblings(siblings, {
      id: 'missing',
      name: 'X',
      updatedAt: '2026-08-14T00:00:00.000Z',
    });
    expect(next).toEqual(siblings);
  });
});
