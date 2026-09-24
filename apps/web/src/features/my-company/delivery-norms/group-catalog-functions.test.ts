import { describe, expect, it } from 'vitest';
import {
  catalogFunctionSearchParts,
  groupCatalogFunctions,
  groupPricedFunctions,
} from './group-catalog-functions';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';

function fn(id: string, category: string, title: string): DeliveryFunctionOperationalDto {
  return {
    id,
    code: id,
    category,
    iconKey: 'layers',
    status: 'PUBLISHED',
    title,
    summary: '',
    scopeBoundaries: '',
    instructions: '',
    acceptanceCriteria: '',
    contentVersion: 1,
    tiers: [],
    attachments: [],
  };
}

describe('groupCatalogFunctions', () => {
  it('keeps first-seen category order', () => {
    const groups = groupCatalogFunctions([
      fn('1', 'Payments', 'Bank'),
      fn('2', 'Warehouse', 'Stock'),
      fn('3', 'Payments', 'Card'),
    ]);
    expect(groups.map((group) => group.category)).toEqual(['Payments', 'Warehouse']);
    expect(groups[0]?.items).toHaveLength(2);
  });
});

describe('catalogFunctionSearchParts', () => {
  it('includes title, code and category', () => {
    expect(catalogFunctionSearchParts(fn('bank', 'Payments', 'Bank'))).toEqual([
      'Bank',
      'bank',
      'Payments',
      '',
    ]);
  });
});

describe('groupPricedFunctions', () => {
  it('groups priced rows by catalog category and keeps unknown ids', () => {
    const groups = groupPricedFunctions(
      [{ functionId: '1' }, { functionId: '3' }, { functionId: 'missing' }, { functionId: '1' }],
      [fn('1', 'Payments', 'Bank'), fn('3', 'Payments', 'Card')],
      'Unknown',
    );
    expect(groups.map((group) => group.category)).toEqual(['Payments', 'Unknown']);
    expect(groups[0]?.functions.map((cluster) => cluster.functionId)).toEqual(['1', '3']);
    expect(groups[0]?.functions[0]?.rows).toHaveLength(2);
    expect(groups[1]?.functions[0]?.title).toBe('Unknown');
  });
});
