import { describe, expect, it } from 'vitest';
import { OPTIONAL_SELECT_NONE } from './delivery-norms.constants';
import { buildBaseProfileWriteBody, emptyProfileDraft } from './base-profile-draft';
import { replaceRoleUnitDraft } from './role-units-draft';

describe('buildBaseProfileWriteBody', () => {
  it('requires productType for PRODUCT and sends null units for empty inputs', () => {
    const draft = emptyProfileDraft();
    draft.profileKey = 'classic-shop';
    expect(buildBaseProfileWriteBody(draft).error).toBe('invalid');
    draft.productType = 'ECOMMERCE';
    const result = buildBaseProfileWriteBody(draft);
    expect(result.error).toBeNull();
    if (result.error !== null) {
      return;
    }
    expect(result.body.roleUnits).toHaveLength(6);
    expect(result.body.roleUnits.every((row) => row.units === null)).toBe(true);
    expect(result.body.productType).toBe('ECOMMERCE');
  });

  it('allows EXTENSION without productType and keeps explicit zero', () => {
    const draft = emptyProfileDraft();
    draft.profileKey = 'ext-small';
    draft.entityKind = 'EXTENSION';
    draft.productType = OPTIONAL_SELECT_NONE;
    draft.roleUnits = replaceRoleUnitDraft(draft.roleUnits, 'BACKEND', { unitsInput: '0' });
    draft.includedFunctionIds = ['fn-1'];
    const result = buildBaseProfileWriteBody(draft);
    expect(result.error).toBeNull();
    if (result.error !== null) {
      return;
    }
    expect(result.body.productType).toBeNull();
    expect(result.body.includedFunctionIds).toEqual([]);
    expect(result.body.roleUnits.find((row) => row.roleKey === 'BACKEND')?.units).toBe('0');
  });
});
