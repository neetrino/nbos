import { DELIVERY_COMPENSATION_ROLE_KEYS } from '@nbos/shared';
import { describe, expect, it } from 'vitest';
import { SEED_ROLE_RATE_AMD } from './delivery-norms.constants';
import {
  buildCompleteRoleUnitVector,
  createEmptyRoleRateDrafts,
  createEmptyRoleUnitDrafts,
  emptyUnitsInputToNull,
  fillRoleRatesAtSeed,
  parseUnitsDraft,
  replaceRoleUnitDraft,
} from './role-units-draft';

describe('emptyUnitsInputToNull', () => {
  it('maps blank and whitespace to null', () => {
    expect(emptyUnitsInputToNull('')).toBeNull();
    expect(emptyUnitsInputToNull('   ')).toBeNull();
  });

  it('keeps an explicit zero as the typed string', () => {
    expect(emptyUnitsInputToNull('0')).toBe('0');
    expect(emptyUnitsInputToNull(' 0.0 ')).toBe('0.0');
  });
});

describe('parseUnitsDraft', () => {
  it('rejects negatives and extra scale', () => {
    expect(parseUnitsDraft('-1')).toBeUndefined();
    expect(parseUnitsDraft('1.23456')).toBeUndefined();
  });

  it('accepts four decimal places and empty', () => {
    expect(parseUnitsDraft('')).toBeNull();
    expect(parseUnitsDraft('1.2500')).toBe('1.2500');
  });
});

describe('buildCompleteRoleUnitVector', () => {
  it('always emits all six roles and null for empty REQUIRED units', () => {
    const vector = buildCompleteRoleUnitVector(createEmptyRoleUnitDrafts());
    expect(vector).not.toBeNull();
    expect(vector?.map((row) => row.roleKey)).toEqual([...DELIVERY_COMPENSATION_ROLE_KEYS]);
    expect(vector?.every((row) => row.units === null)).toBe(true);
  });

  it('forces NOT_REQUIRED units to null even if the input has a number', () => {
    const drafts = replaceRoleUnitDraft(createEmptyRoleUnitDrafts(), 'QA', {
      unitKind: 'NOT_REQUIRED',
      unitsInput: '8',
    });
    const vector = buildCompleteRoleUnitVector(drafts);
    const qa = vector?.find((row) => row.roleKey === 'QA');
    expect(qa).toEqual({ roleKey: 'QA', unitKind: 'NOT_REQUIRED', units: null });
  });

  it('keeps OPTIONAL units instead of clearing them', () => {
    const drafts = replaceRoleUnitDraft(createEmptyRoleUnitDrafts(), 'QA', {
      unitKind: 'OPTIONAL',
      unitsInput: '4',
    });
    const vector = buildCompleteRoleUnitVector(drafts);
    expect(vector?.find((row) => row.roleKey === 'QA')).toEqual({
      roleKey: 'QA',
      unitKind: 'OPTIONAL',
      units: '4',
    });
  });

  it('preserves an explicit zero on a REQUIRED role', () => {
    const drafts = replaceRoleUnitDraft(createEmptyRoleUnitDrafts(), 'BACKEND', {
      unitsInput: '0',
    });
    const vector = buildCompleteRoleUnitVector(drafts);
    const backend = vector?.find((row) => row.roleKey === 'BACKEND');
    expect(backend?.units).toBe('0');
  });

  it('returns null when a role is missing from the draft', () => {
    const incomplete = createEmptyRoleUnitDrafts().slice(1);
    expect(buildCompleteRoleUnitVector(incomplete)).toBeNull();
  });
});

describe('fillRoleRatesAtSeed', () => {
  it('writes 1000 for every role without hiding the values', () => {
    const filled = fillRoleRatesAtSeed(createEmptyRoleRateDrafts());
    expect(Object.values(filled)).toEqual(
      DELIVERY_COMPENSATION_ROLE_KEYS.map(() => SEED_ROLE_RATE_AMD),
    );
  });
});
