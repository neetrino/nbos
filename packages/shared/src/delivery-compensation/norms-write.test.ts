import { describe, expect, it } from 'vitest';
import {
  CatalogContentValidationError,
  CatalogFinancialMassAssignmentError,
} from './catalog-write';
import { DELIVERY_COMPENSATION_ROLE_KEYS } from './constants';
import {
  parseBaseProfileWriteBody,
  parseFunctionPriceWriteBody,
  functionPriceTierTargetError,
} from './norms-write';

const FUNCTION_ID = '11111111-2222-3333-4444-555555555555';
const OTHER_ID = '66666666-7777-8888-9999-aaaaaaaaaaaa';

function fullVector(units: string | null = '10') {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    unitKind: 'REQUIRED',
    units,
  }));
}

function baseProfileBody(overrides: Record<string, unknown> = {}) {
  return {
    productType: 'ECOMMERCE',
    productCategory: 'CODE',
    implementationBase: 'FROM_SCRATCH',
    designMode: 'FULL_DESIGN',
    effectiveFrom: '2026-10-01T00:00:00.000Z',
    roleUnits: fullVector(),
    ...overrides,
  };
}

describe('parseFunctionPriceWriteBody', () => {
  it('accepts a complete six-role vector', () => {
    const parsed = parseFunctionPriceWriteBody({
      functionId: FUNCTION_ID,
      effectiveFrom: '2026-10-01T00:00:00.000Z',
      roleUnits: fullVector('12.5'),
    });

    expect(parsed.functionId).toBe(FUNCTION_ID);
    expect(parsed.tierId).toBeNull();
    expect(parsed.roleUnits).toHaveLength(DELIVERY_COMPENSATION_ROLE_KEYS.length);
    expect(parsed.roleUnits.every((row) => row.units === '12.5')).toBe(true);
  });

  it('keeps an unset role as null instead of zero', () => {
    const parsed = parseFunctionPriceWriteBody({
      functionId: FUNCTION_ID,
      effectiveFrom: '2026-10-01T00:00:00.000Z',
      roleUnits: fullVector(null),
    });

    expect(parsed.roleUnits.every((row) => row.units === null)).toBe(true);
  });

  it('keeps an explicit zero distinct from null', () => {
    const parsed = parseFunctionPriceWriteBody({
      functionId: FUNCTION_ID,
      effectiveFrom: '2026-10-01T00:00:00.000Z',
      roleUnits: fullVector('0'),
    });

    expect(parsed.roleUnits.every((row) => row.units === '0')).toBe(true);
  });

  it('rejects an incomplete role vector', () => {
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector().slice(0, 3),
      }),
    ).toThrow(CatalogContentValidationError);
  });

  it('rejects duplicate roles', () => {
    const vector = fullVector();
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: [...vector, vector[0]],
      }),
    ).toThrow(/duplicate/);
  });

  it('rejects negative units', () => {
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector('-1'),
      }),
    ).toThrow(/greater or equal/);
  });

  it('accepts OPTIONAL with units and rejects empty-kind leakage', () => {
    const [firstRole, ...otherRoles] = DELIVERY_COMPENSATION_ROLE_KEYS;
    const roleUnits = [
      { roleKey: firstRole, unitKind: 'OPTIONAL', units: '5' },
      ...otherRoles.map((roleKey) => ({ roleKey, unitKind: 'REQUIRED', units: '10' })),
    ];
    const parsed = parseFunctionPriceWriteBody({
      functionId: FUNCTION_ID,
      effectiveFrom: '2026-10-01T00:00:00.000Z',
      roleUnits,
    });
    expect(parsed.roleUnits[0]).toEqual({
      roleKey: firstRole,
      unitKind: 'OPTIONAL',
      units: '5',
    });
  });

  it('rejects units on a NOT_REQUIRED role', () => {
    const [firstRole, ...otherRoles] = DELIVERY_COMPENSATION_ROLE_KEYS;
    const roleUnits = [
      { roleKey: firstRole, unitKind: 'NOT_REQUIRED', units: '5' },
      ...otherRoles.map((roleKey) => ({ roleKey, unitKind: 'REQUIRED', units: '10' })),
    ];
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits,
      }),
    ).toThrow(/NOT_REQUIRED/);
  });

  it('rejects employee or salary fields', () => {
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector(),
        employeeId: 'emp-1',
      }),
    ).toThrow(CatalogFinancialMassAssignmentError);
  });

  it('rejects a non-uuid functionId', () => {
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: 'not-a-uuid',
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector(),
      }),
    ).toThrow(/uuid/);
  });

  it('keeps a missing tierId as null and accepts a uuid', () => {
    expect(
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector(),
      }).tierId,
    ).toBeNull();
    expect(
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        tierId: OTHER_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector(),
      }).tierId,
    ).toBe(OTHER_ID);
  });

  it('rejects a non-uuid tierId', () => {
    expect(() =>
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        tierId: 'not-a-uuid',
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: fullVector(),
      }),
    ).toThrow(/uuid/);
  });
});

describe('functionPriceTierTargetError', () => {
  it('allows a card-level draft only when the function has no volumes', () => {
    expect(functionPriceTierTargetError([], null)).toBeNull();
    expect(functionPriceTierTargetError([], OTHER_ID)).toMatch(/not used/);
  });

  it('requires a belonging volume when the function has gradations', () => {
    expect(functionPriceTierTargetError([OTHER_ID], null)).toMatch(/required/);
    expect(functionPriceTierTargetError([OTHER_ID], FUNCTION_ID)).toMatch(/belong/);
    expect(functionPriceTierTargetError([OTHER_ID], OTHER_ID)).toBeNull();
  });
});

describe('parseBaseProfileWriteBody', () => {
  it('accepts a product profile', () => {
    const parsed = parseBaseProfileWriteBody(
      baseProfileBody({ includedFunctionIds: [FUNCTION_ID, OTHER_ID, FUNCTION_ID] }),
    );

    expect(parsed.productType).toBe('ECOMMERCE');
    expect(parsed.implementationBase).toBe('FROM_SCRATCH');
    expect(parsed.designMode).toBe('AI_DESIGN');
    expect(parsed.aiDesignerReview).toBe(false);
    expect(parsed.includedFunctionIds).toEqual([FUNCTION_ID, OTHER_ID]);
  });

  it('rejects an extension axis and a hidden product type', () => {
    expect(() => parseBaseProfileWriteBody(baseProfileBody({ entityKind: 'EXTENSION' }))).toThrow(
      /entityKind is not an axis/,
    );
    expect(() => parseBaseProfileWriteBody(baseProfileBody({ productType: 'MOBILE_APP' }))).toThrow(
      /not offered/,
    );
  });

  it('requires a product type and ignores a client profile key', () => {
    expect(() => parseBaseProfileWriteBody(baseProfileBody({ productType: null }))).toThrow(
      /productType is required/,
    );
    const parsed = parseBaseProfileWriteBody(baseProfileBody({ profileKey: 'second-core' }));
    expect(parsed.productType).toBe('ECOMMERCE');
    expect('profileKey' in parsed).toBe(false);
  });

  it('rejects an unknown product type', () => {
    expect(() =>
      parseBaseProfileWriteBody(baseProfileBody({ productType: 'NOT_A_PRODUCT_TYPE' })),
    ).toThrow(/productType is invalid/);
  });
});
