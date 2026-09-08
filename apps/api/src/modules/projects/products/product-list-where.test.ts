import { describe, expect, it } from 'vitest';
import {
  applyProductHubAndSearch,
  buildProductHubViewWhere,
  classifyProductHubView,
  classifyProductHubViewFromRow,
  parseIncludeHubView,
  parseProductHubView,
  shouldClassifyProductHubView,
} from './product-list-where';

describe('parseProductHubView', () => {
  it('accepts delivery, maintenance, and closed', () => {
    expect(parseProductHubView('delivery')).toBe('delivery');
    expect(parseProductHubView('maintenance')).toBe('maintenance');
    expect(parseProductHubView('closed')).toBe('closed');
  });

  it('ignores missing and unknown values', () => {
    expect(parseProductHubView(undefined)).toBeUndefined();
    expect(parseProductHubView('')).toBeUndefined();
    expect(parseProductHubView('active')).toBeUndefined();
  });
});

describe('shouldClassifyProductHubView', () => {
  it('is off for a generic list', () => {
    expect(parseIncludeHubView(undefined)).toBe(false);
    expect(shouldClassifyProductHubView()).toBe(false);
  });

  it('turns on for includeHubView or a parsed hubView', () => {
    expect(parseIncludeHubView('true')).toBe(true);
    expect(parseIncludeHubView('1')).toBe(true);
    expect(shouldClassifyProductHubView(undefined, true)).toBe(true);
    expect(shouldClassifyProductHubView('delivery')).toBe(true);
  });
});

describe('classifyProductHubView', () => {
  it('prefers open delivery over live maintenance', () => {
    expect(classifyProductHubView({ isOpenDelivery: true, hasLiveMaintenance: true })).toBe(
      'delivery',
    );
  });

  it('classifies closed delivery with live maintenance as maintenance', () => {
    expect(classifyProductHubView({ isOpenDelivery: false, hasLiveMaintenance: true })).toBe(
      'maintenance',
    );
  });

  it('classifies closed delivery without live maintenance as closed', () => {
    expect(classifyProductHubView({ isOpenDelivery: false, hasLiveMaintenance: false })).toBe(
      'closed',
    );
  });
});

describe('classifyProductHubViewFromRow', () => {
  it('treats DONE as closed delivery', () => {
    expect(
      classifyProductHubViewFromRow({
        deliveryResolution: 'DONE',
        status: 'DONE',
        subscriptions: [{ id: 'sub-1' }],
      }),
    ).toBe('maintenance');
  });

  it('treats open legacy status as delivery', () => {
    expect(
      classifyProductHubViewFromRow({
        deliveryResolution: null,
        status: 'DEVELOPMENT',
        subscriptions: [],
      }),
    ).toBe('delivery');
  });
});

describe('buildProductHubViewWhere', () => {
  it('uses open delivery for delivery view', () => {
    expect(buildProductHubViewWhere('delivery')).toEqual({
      deliveryResolution: null,
      status: { notIn: ['DONE', 'LOST'] },
    });
  });

  it('requires closed delivery and live subscription for maintenance', () => {
    const where = buildProductHubViewWhere('maintenance');
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ OR: expect.any(Array) }),
        expect.objectContaining({ subscriptions: { some: expect.any(Object) } }),
      ]),
    );
  });

  it('requires closed delivery and no live subscription for closed', () => {
    const where = buildProductHubViewWhere('closed');
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subscriptions: { none: expect.any(Object) } }),
      ]),
    );
  });
});

describe('applyProductHubAndSearch', () => {
  it('combines hubView and search without colliding OR clauses', () => {
    const where = { projectId: 'proj-1' };
    applyProductHubAndSearch(where, 'delivery', 'nbos');
    expect(where.AND).toEqual([
      expect.objectContaining({ deliveryResolution: null }),
      { OR: expect.any(Array) },
    ]);
  });

  it('applies search alone as OR', () => {
    const where = {};
    applyProductHubAndSearch(where, undefined, 'site');
    expect(where.OR).toEqual(
      expect.arrayContaining([{ name: { contains: 'site', mode: 'insensitive' } }]),
    );
  });
});
