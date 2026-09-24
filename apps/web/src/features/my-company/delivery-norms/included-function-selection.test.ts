import { describe, expect, it } from 'vitest';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import {
  addableIncludedOptions,
  addIncludedFunctionId,
  removeIncludedFunctionId,
  selectedIncludedFunctions,
} from './included-function-selection';

function fn(id: string, title: string): DeliveryFunctionOperationalDto {
  return {
    id,
    code: `${id}-code`,
    category: 'Payments',
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

describe('included function selection', () => {
  it('lists selected items in chosen order and hides them from add options', () => {
    const catalog = [fn('a', 'Alpha'), fn('b', 'Beta'), fn('c', 'Gamma')];
    expect(selectedIncludedFunctions(catalog, ['c', 'a']).map((item) => item.id)).toEqual([
      'c',
      'a',
    ]);
    expect(addableIncludedOptions(catalog, ['c', 'a']).map((option) => option.value)).toEqual([
      'b',
    ]);
  });

  it('adds a function once and removes it from the list', () => {
    expect(addIncludedFunctionId(['a'], 'b')).toEqual(['a', 'b']);
    expect(addIncludedFunctionId(['a'], 'a')).toEqual(['a']);
    expect(removeIncludedFunctionId(['a', 'b'], 'a')).toEqual(['b']);
  });
});
