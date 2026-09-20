import { describe, expect, it } from 'vitest';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import {
  catalogFunctionGradations,
  EMPTY_GRADATION_SELECTION,
  functionHasGradations,
  selectFunctionForGradation,
  selectionWithoutFunction,
  setFunctionGradation,
  tierIdForAdd,
  toggleFunctionClearsGradation,
} from './function-catalog-gradation';

function catalogItem(
  overrides: Partial<DeliveryFunctionOperationalDto> = {},
): DeliveryFunctionOperationalDto {
  return {
    id: 'fn-1',
    code: 'PAYMENTS_CARD',
    category: 'payments',
    iconKey: 'CreditCard',
    status: 'ACTIVE',
    title: 'Card payments',
    summary: 'Accept cards',
    scopeBoundaries: '',
    instructions: '',
    acceptanceCriteria: '',
    contentVersion: 1,
    tiers: [],
    attachments: [],
    ...overrides,
  };
}

describe('catalogFunctionGradations', () => {
  it('finds no volumes on a card sold at a single volume', () => {
    expect(catalogFunctionGradations(catalogItem())).toEqual([]);
    expect(functionHasGradations(catalogItem())).toBe(false);
  });

  it('lists volumes in catalog order, whatever order they arrive in', () => {
    const item = catalogItem({
      tiers: [
        { id: 'tier-system', code: 'T3', label: 'CRM, ERP, платформа', position: 3 },
        { id: 'tier-site', code: 'T1', label: 'Лендинг и сайт компании', position: 1 },
        { id: 'tier-shop', code: 'T2', label: 'Магазин', position: 2 },
      ],
    });

    expect(catalogFunctionGradations(item).map((tier) => tier.id)).toEqual([
      'tier-site',
      'tier-shop',
      'tier-system',
    ]);
    expect(functionHasGradations(item)).toBe(true);
  });

  it('carries the label a person reads, not the internal code', () => {
    const item = catalogItem({
      tiers: [{ id: 'tier-site', code: 'T1', label: 'Лендинг и сайт компании', position: 1 }],
    });

    expect(catalogFunctionGradations(item)[0]).toEqual({
      id: 'tier-site',
      label: 'Лендинг и сайт компании',
    });
  });
});

describe('gradation selection state', () => {
  it('records a volume for a function and clears it when chosen again', () => {
    const once = setFunctionGradation(EMPTY_GRADATION_SELECTION, 'fn-1', 'tier-site');
    expect(once).toEqual({ 'fn-1': 'tier-site' });
    expect(setFunctionGradation(once, 'fn-1', 'tier-system')).toEqual({ 'fn-1': 'tier-system' });
    expect(setFunctionGradation(once, 'fn-1', 'tier-site')).toEqual({});
  });

  it('leaves tierId unset when no volume is chosen', () => {
    expect(tierIdForAdd(EMPTY_GRADATION_SELECTION, 'fn-1')).toBeUndefined();
    expect(tierIdForAdd({ 'fn-2': 'tier-a' }, 'fn-1')).toBeUndefined();
    expect(tierIdForAdd({ 'fn-1': 'tier-site' }, 'fn-1')).toBe('tier-site');
  });

  it('clears a volume when the function is toggled off', () => {
    const selected = toggleFunctionClearsGradation(
      ['fn-1', 'fn-2'],
      { 'fn-1': 'tier-site', 'fn-2': 'tier-a' },
      'fn-1',
    );
    expect(selected).toEqual({ 'fn-2': 'tier-a' });
    expect(toggleFunctionClearsGradation(['fn-2'], { 'fn-1': 'tier-site' }, 'fn-1')).toEqual({
      'fn-1': 'tier-site',
    });
  });

  it('selects the function when a volume is chosen', () => {
    expect(selectFunctionForGradation(['fn-2'], 'fn-1')).toEqual(['fn-2', 'fn-1']);
    expect(selectFunctionForGradation(['fn-1'], 'fn-1')).toEqual(['fn-1']);
  });

  it('drops only the named function from the selection map', () => {
    expect(selectionWithoutFunction({ 'fn-1': 'a', 'fn-2': 'b' }, 'fn-1')).toEqual({
      'fn-2': 'b',
    });
    expect(selectionWithoutFunction({ 'fn-2': 'b' }, 'fn-1')).toEqual({ 'fn-2': 'b' });
  });
});
