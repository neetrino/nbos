import { describe, expect, it } from 'vitest';
import { CatalogFinancialMassAssignmentError } from './catalog-write';
import { parseRoleRateWriteBody } from './rules-write';

describe('parseRoleRateWriteBody', () => {
  it('rejects employee-specific or salary fields', () => {
    expect(() =>
      parseRoleRateWriteBody({
        roleKey: 'BACKEND',
        rate: '1000',
        effectiveFrom: '2026-01-01',
        employeeId: 'emp-1',
      }),
    ).toThrow(CatalogFinancialMassAssignmentError);
  });

  it('rejects a non-AMD currency', () => {
    expect(() =>
      parseRoleRateWriteBody({
        roleKey: 'BACKEND',
        rate: '1000',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
        currency: 'USD',
      }),
    ).toThrow('currency must be AMD');
  });

  it('rejects a negative rate', () => {
    expect(() =>
      parseRoleRateWriteBody({
        roleKey: 'BACKEND',
        rate: '-1',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow('rate must be greater than or equal to 0');
  });

  it('accepts a same-role AMD rate', () => {
    expect(
      parseRoleRateWriteBody({
        roleKey: 'BACKEND',
        rate: '1000',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      }),
    ).toMatchObject({ roleKey: 'BACKEND', currency: 'AMD' });
  });
});
