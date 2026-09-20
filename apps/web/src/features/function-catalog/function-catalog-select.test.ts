import { describe, expect, it } from 'vitest';
import {
  addFeatureMessageKey,
  canAddFunctionsToConfiguration,
  canConfirmSelection,
  isCatalogFunctionSelectable,
  isPlanMaterialized,
  toggleCatalogSelection,
} from './function-catalog-select';

describe('isCatalogFunctionSelectable', () => {
  it('allows only active functions that are not already on the product', () => {
    const added = new Set(['fn-added']);
    expect(isCatalogFunctionSelectable({ id: 'fn-new', status: 'ACTIVE' }, added)).toBe(true);
    expect(isCatalogFunctionSelectable({ id: 'fn-new', status: 'DRAFT' }, added)).toBe(false);
    expect(isCatalogFunctionSelectable({ id: 'fn-added', status: 'ACTIVE' }, added)).toBe(false);
  });
});

describe('toggleCatalogSelection', () => {
  it('adds and removes ids without duplicates', () => {
    expect(toggleCatalogSelection([], 'a')).toEqual(['a']);
    expect(toggleCatalogSelection(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('canAddFunctionsToConfiguration', () => {
  it('requires edit permission, v2 enrollment, and an open delivery', () => {
    expect(
      canAddFunctionsToConfiguration({
        enrolled: true,
        canEdit: true,
        deliveryStatus: 'DEVELOPMENT',
      }),
    ).toBe(true);
    expect(
      canAddFunctionsToConfiguration({
        enrolled: false,
        canEdit: true,
        deliveryStatus: 'DEVELOPMENT',
      }),
    ).toBe(false);
    expect(
      canAddFunctionsToConfiguration({
        enrolled: true,
        canEdit: false,
        deliveryStatus: 'DEVELOPMENT',
      }),
    ).toBe(false);
    expect(
      canAddFunctionsToConfiguration({ enrolled: true, canEdit: true, deliveryStatus: 'DONE' }),
    ).toBe(false);
    expect(
      canAddFunctionsToConfiguration({ enrolled: true, canEdit: true, deliveryStatus: 'LOST' }),
    ).toBe(false);
    expect(
      canAddFunctionsToConfiguration({ enrolled: true, canEdit: true, deliveryStatus: null }),
    ).toBe(false);
  });
});

describe('addFeatureMessageKey', () => {
  it('maps duplicate and closed codes to readable keys', () => {
    expect(addFeatureMessageKey('FUNCTION_ALREADY_SELECTED')).toBe('alreadySelected');
    expect(addFeatureMessageKey('FINANCIAL_ALLOCATION_LOCKED')).toBe('closedReadOnly');
    expect(addFeatureMessageKey('FUNCTION_TIER_REQUIRED')).toBe('tierRequired');
    expect(addFeatureMessageKey('CONFIGURATION_CONFLICT')).toBeNull();
  });
});

describe('isPlanMaterialized', () => {
  it('is true only for a materialized plan', () => {
    expect(isPlanMaterialized('MATERIALIZED')).toBe(true);
    expect(isPlanMaterialized('DRAFT')).toBe(false);
    expect(isPlanMaterialized(undefined)).toBe(false);
  });
});

describe('canConfirmSelection', () => {
  const base = { selectedCount: 2, requireReason: false, reason: '', saving: false };

  it('needs at least one selected function', () => {
    expect(canConfirmSelection({ ...base, selectedCount: 0 })).toBe(false);
    expect(canConfirmSelection(base)).toBe(true);
  });

  it('blocks while saving', () => {
    expect(canConfirmSelection({ ...base, saving: true })).toBe(false);
  });

  it('demands a reason once the plan is materialized', () => {
    expect(canConfirmSelection({ ...base, requireReason: true })).toBe(false);
    expect(canConfirmSelection({ ...base, requireReason: true, reason: '   ' })).toBe(false);
    expect(canConfirmSelection({ ...base, requireReason: true, reason: 'client asked' })).toBe(
      true,
    );
  });
});
