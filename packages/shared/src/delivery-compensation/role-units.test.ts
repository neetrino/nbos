import { describe, expect, it } from 'vitest';
import { DELIVERY_COMPENSATION_ROLE_KEYS } from './constants';
import {
  assertCompleteRoleMatrix,
  findUnconfiguredRequiredRoles,
  hasExplicitZeroRequiredUnits,
  isExplicitZeroUnits,
  isPublishedRoleVectorComplete,
  isRoleUnitsConfigured,
  requiredAssigneeRoles,
  sumPayableRoleUnits,
  type DeliveryRoleUnitInput,
} from './role-units';

function fullMatrix(
  overrides: Partial<
    Record<(typeof DELIVERY_COMPENSATION_ROLE_KEYS)[number], DeliveryRoleUnitInput>
  >,
): DeliveryRoleUnitInput[] {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => {
    return (
      overrides[roleKey] ?? {
        roleKey,
        unitKind: 'REQUIRED',
        units: '1',
      }
    );
  });
}

describe('delivery role units', () => {
  it('treats null as not configured and 0 as an explicit zero', () => {
    expect(isExplicitZeroUnits(null)).toBe(false);
    expect(isExplicitZeroUnits('0')).toBe(true);
    expect(isExplicitZeroUnits('0.0000')).toBe(true);
    expect(isRoleUnitsConfigured({ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: null })).toBe(
      false,
    );
    expect(isRoleUnitsConfigured({ roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '0' })).toBe(
      true,
    );
  });

  it('treats OPTIONAL like REQUIRED for configuration and like a paid slot', () => {
    expect(isRoleUnitsConfigured({ roleKey: 'QA', unitKind: 'OPTIONAL', units: null })).toBe(false);
    expect(isRoleUnitsConfigured({ roleKey: 'QA', unitKind: 'OPTIONAL', units: '4' })).toBe(true);
    const missing = fullMatrix({
      QA: { roleKey: 'QA', unitKind: 'OPTIONAL', units: null },
    });
    expect(findUnconfiguredRequiredRoles(missing)).toEqual(['QA']);
    expect(isPublishedRoleVectorComplete(missing)).toBe(false);
    expect(
      hasExplicitZeroRequiredUnits(
        fullMatrix({ QA: { roleKey: 'QA', unitKind: 'OPTIONAL', units: '0' } }),
      ),
    ).toBe(true);
  });

  it('requires NOT_REQUIRED rows to keep units null', () => {
    expect(
      isRoleUnitsConfigured({
        roleKey: 'DESIGNER',
        unitKind: 'NOT_REQUIRED',
        units: null,
      }),
    ).toBe(true);
    expect(
      isRoleUnitsConfigured({
        roleKey: 'DESIGNER',
        unitKind: 'NOT_REQUIRED',
        units: '0',
      }),
    ).toBe(false);
  });

  it('blocks publish when a required role is null and allows explicit zero', () => {
    const missing = fullMatrix({
      QA: { roleKey: 'QA', unitKind: 'REQUIRED', units: null },
    });
    expect(findUnconfiguredRequiredRoles(missing)).toEqual(['QA']);
    expect(isPublishedRoleVectorComplete(missing)).toBe(false);

    const zero = fullMatrix({
      QA: { roleKey: 'QA', unitKind: 'REQUIRED', units: '0' },
    });
    expect(isPublishedRoleVectorComplete(zero)).toBe(true);
    expect(hasExplicitZeroRequiredUnits(zero)).toBe(true);
    expect(hasExplicitZeroRequiredUnits(fullMatrix({}))).toBe(false);
  });

  it('asks for an assignee only on REQUIRED roles', () => {
    expect(
      requiredAssigneeRoles(
        fullMatrix({
          QA: { roleKey: 'QA', unitKind: 'OPTIONAL', units: '4' },
          DESIGNER: { roleKey: 'DESIGNER', unitKind: 'NOT_REQUIRED', units: null },
        }),
      ),
    ).toEqual(['BACKEND', 'FRONTEND', 'PM', 'TECHNICAL_SPECIALIST']);
  });

  it('sums payable roles that have a number, including explicit zero', () => {
    expect(
      sumPayableRoleUnits([
        { unitKind: 'REQUIRED', units: '10' },
        { unitKind: 'OPTIONAL', units: '2.5' },
        { unitKind: 'OPTIONAL', units: '0' },
        { unitKind: 'NOT_REQUIRED', units: '8' },
        { unitKind: 'REQUIRED', units: null },
        { unitKind: 'OPTIONAL', units: '' },
      ]),
    ).toBe('12.5000');
    expect(sumPayableRoleUnits([{ unitKind: 'REQUIRED', units: null }])).toBeNull();
  });

  it('requires all six roles in a published matrix', () => {
    const incomplete = fullMatrix({}).filter((row) => row.roleKey !== 'PM');
    expect(assertCompleteRoleMatrix(incomplete)).toEqual(['PM']);
    expect(isPublishedRoleVectorComplete(incomplete)).toBe(false);
  });
});
