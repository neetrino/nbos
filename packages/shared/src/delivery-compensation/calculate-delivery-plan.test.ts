import { describe, expect, it } from 'vitest';
import { allocateShares, assertShareSumMatchesTotal } from './allocate-shares';
import { calculateDeliveryPlan } from './calculate-delivery-plan';
import { pickPublishedAsOf } from './pick-published-as-of';
import {
  SYNTHETIC_TEST_BANK_UNITS,
  SYNTHETIC_TEST_BASE_BY_ROLE,
  SYNTHETIC_TEST_BASE_PLUS_WAREHOUSE,
  SYNTHETIC_TEST_BASE_TOTAL,
  SYNTHETIC_TEST_BASE_UNITS,
  SYNTHETIC_TEST_RATES,
  SYNTHETIC_TEST_WAREHOUSE_UNITS,
} from './synthetic-test-fixtures';

describe('calculateDeliveryPlan C01–C10 (synthetic fixtures only)', () => {
  it('C01: base only totals 187500 across six roles, not an order price', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS,
      rates: SYNTHETIC_TEST_RATES,
      features: [],
    });
    expect(result.ok).toBe(true);
    expect(result.total).toBe(SYNTHETIC_TEST_BASE_TOTAL);
    expect(result.totalsByRole).toEqual(SYNTHETIC_TEST_BASE_BY_ROLE);
  });

  it('C02: included Bank is visible and does not add money', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS,
      rates: SYNTHETIC_TEST_RATES,
      features: [{ functionId: 'bank', origin: 'INCLUDED', roleUnits: SYNTHETIC_TEST_BANK_UNITS }],
    });
    expect(result.total).toBe(SYNTHETIC_TEST_BASE_TOTAL);
    expect(result.visibleIncludedFunctionIds).toEqual(['bank']);
    expect(result.lines.some((line) => line.componentKey.includes('bank'))).toBe(false);
  });

  it('C03: extra Warehouse adds 15200 on three roles only', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS,
      rates: SYNTHETIC_TEST_RATES,
      features: [
        { functionId: 'warehouse', origin: 'EXTRA', roleUnits: SYNTHETIC_TEST_WAREHOUSE_UNITS },
      ],
    });
    expect(result.total).toBe(SYNTHETIC_TEST_BASE_PLUS_WAREHOUSE);
    expect(result.totalsByRole.BACKEND).toBe('110000.00');
    expect(result.totalsByRole.FRONTEND).toBe('44000.00');
    expect(result.totalsByRole.QA).toBe('7200.00');
    expect(result.totalsByRole.PM).toBe(SYNTHETIC_TEST_BASE_BY_ROLE.PM);
  });

  it('C04: Bank as extra on profile B is added once from its price vector', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS,
      rates: SYNTHETIC_TEST_RATES,
      features: [{ functionId: 'bank', origin: 'EXTRA', roleUnits: SYNTHETIC_TEST_BANK_UNITS }],
    });
    const bankLines = result.lines.filter((line) => line.componentKey === 'FEATURE:bank');
    expect(bankLines).toHaveLength(2);
    expect(result.total).toBe('198700.00');
  });

  it('C05: one employee Backend+Frontend keeps both role amounts, no 70/30', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS,
      rates: SYNTHETIC_TEST_RATES,
      features: [],
    });
    expect(result.totalsByRole.BACKEND).toBe('100000.00');
    expect(result.totalsByRole.FRONTEND).toBe('40000.00');
    expect(result.lines.some((line) => line.amount === '70000.00')).toBe(false);
  });

  it('C06: null required units block; explicit zero is allowed and pays nothing', () => {
    const blocked = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS.map((row) =>
        row.roleKey === 'QA' ? { ...row, units: null } : row,
      ),
      rates: SYNTHETIC_TEST_RATES,
      features: [],
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.errors).toContain('UNITS_NOT_CONFIGURED');

    const zero = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS.map((row) =>
        row.roleKey === 'QA' ? { ...row, units: '0' } : row,
      ),
      rates: SYNTHETIC_TEST_RATES,
      features: [],
    });
    expect(zero.ok).toBe(true);
    expect(zero.totalsByRole.QA).toBe('0.00');
  });

  it('C07: new Backend rate 1200 applies only to new components', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: [],
      rates: SYNTHETIC_TEST_RATES.map((row) =>
        row.roleKey === 'BACKEND' ? { ...row, rate: '1200' } : row,
      ),
      features: [
        {
          functionId: 'late-extra',
          origin: 'EXTRA',
          roleUnits: [
            { roleKey: 'BACKEND', unitKind: 'REQUIRED', units: '10' },
            { roleKey: 'FRONTEND', unitKind: 'NOT_REQUIRED', units: null },
            { roleKey: 'PM', unitKind: 'NOT_REQUIRED', units: null },
            { roleKey: 'DESIGNER', unitKind: 'NOT_REQUIRED', units: null },
            { roleKey: 'QA', unitKind: 'NOT_REQUIRED', units: null },
            { roleKey: 'TECHNICAL_SPECIALIST', unitKind: 'NOT_REQUIRED', units: null },
          ],
        },
      ],
      frozenComponents: [
        {
          componentKey: 'BASE',
          roleKey: 'BACKEND',
          units: '100',
          rate: '1000',
          amount: '100000.00',
        },
      ],
    });
    expect(result.totalsByRole.BACKEND).toBe('112000.00');
    const frozen = result.lines.find((line) => line.componentKey === 'BASE');
    expect(frozen?.amount).toBe('100000.00');
    expect(frozen?.rate).toBe('1000');
  });

  it('C08: Designer units pay from the core vector; design mode is not an axis', () => {
    const result = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS.map((row) =>
        row.roleKey === 'DESIGNER' ? { ...row, units: '10' } : row,
      ),
      rates: SYNTHETIC_TEST_RATES,
      features: [],
    });
    expect(result.ok).toBe(true);
    expect(result.errors).not.toContain('AI_DESIGNER_REVIEW_REQUIRED');
    expect(result.totalsByRole.DESIGNER).toBe('7000.00');
  });

  it('C09: 10.01 split 33/67 keeps the exact sum', () => {
    const shares = allocateShares('10.01', [
      { key: 'a', percent: '33' },
      { key: 'b', percent: '67' },
    ]);
    expect(assertShareSumMatchesTotal('10.01', shares)).toBe(true);
  });

  it('C10: a later 5-unit vector does not multiply an older 50-unit snapshot', () => {
    const fresh = calculateDeliveryPlan({
      baseRoleUnits: SYNTHETIC_TEST_BASE_UNITS.map((row) =>
        row.roleKey === 'BACKEND' ? { ...row, units: '5' } : row,
      ),
      rates: SYNTHETIC_TEST_RATES,
      features: [],
    });
    expect(fresh.totalsByRole.BACKEND).toBe('5000.00');
    expect(fresh.totalsByRole.BACKEND).not.toBe('250000.00');
  });
});

describe('pickPublishedAsOf', () => {
  it('uses the latest published version that already started', () => {
    const picked = pickPublishedAsOf(
      [
        { id: 'old', status: 'PUBLISHED', effectiveFrom: new Date('2026-01-01') },
        { id: 'current', status: 'PUBLISHED', effectiveFrom: new Date('2026-06-01') },
        { id: 'future', status: 'PUBLISHED', effectiveFrom: new Date('2026-12-01') },
        { id: 'draft', status: 'DRAFT', effectiveFrom: new Date('2026-05-01') },
      ],
      new Date('2026-07-01'),
    );
    expect(picked).toMatchObject({ id: 'current' });
  });
});
