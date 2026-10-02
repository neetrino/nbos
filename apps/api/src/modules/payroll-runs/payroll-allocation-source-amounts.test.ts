import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  assertChosenSourceAmounts,
  assertPayrollManualBonusTitle,
  decodePayrollAllocationSourceAmounts,
  encodePayrollAllocationSourceAmounts,
  isOwnedPayrollAllocationSourceSplit,
  parsePayrollAllocationSourceAmounts,
  remainingForBonusEntry,
} from './payroll-allocation-source-amounts';

describe('payroll allocation source amounts', () => {
  it('round-trips a chosen 50 + 30 split', () => {
    const splits = parsePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-50', amount: '50.00' },
      { bonusEntryId: 'be-70', amount: '30.00' },
    ]);
    const encoded = encodePayrollAllocationSourceAmounts(splits);
    expect(decodePayrollAllocationSourceAmounts(encoded)).toEqual([
      { bonusEntryId: 'be-50', amount: new Decimal('50.00') },
      { bonusEntryId: 'be-70', amount: new Decimal('30.00') },
    ]);
  });

  it('does not treat a display title as a split', () => {
    expect(decodePayrollAllocationSourceAmounts('Extra award')).toBeNull();
  });

  it('treats a broken source-amount title as no split', () => {
    expect(decodePayrollAllocationSourceAmounts('nbos:v1:sourceAmounts:not-json')).toBeNull();
  });

  it('rejects a manual title that uses the source-amount prefix', () => {
    expect(() => assertPayrollManualBonusTitle('nbos:v1:sourceAmounts:[]')).toThrow(
      BadRequestException,
    );
  });

  it('rejects a decoded split that points at another employee plan', () => {
    const splits = parsePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-other', amount: '50.00' },
    ]);
    expect(splits).not.toBeNull();
    expect(
      isOwnedPayrollAllocationSourceSplit({
        splits: splits ?? [],
        draftAmount: new Decimal(50),
        owners: new Map([['be-other', { employeeId: 'e2', orderId: 'o1' }]]),
        employeeId: 'e1',
        orderId: 'o1',
      }),
    ).toBe(false);
  });

  it('rejects a split that does not sum to the cell amount', () => {
    const splits = parsePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-50', amount: '50.00' },
      { bonusEntryId: 'be-70', amount: '30.00' },
    ]);
    expect(splits).not.toBeNull();
    expect(() =>
      assertChosenSourceAmounts({
        splits: splits ?? [],
        cellAmount: new Decimal('80.01'),
        remainingByEntry: new Map([
          ['be-50', new Decimal(50)],
          ['be-70', new Decimal(70)],
        ]),
        visibleIds: new Set(['be-50', 'be-70']),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects writing more than one source remaining', () => {
    const splits = parsePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-50', amount: '80.00' },
    ]);
    expect(splits).not.toBeNull();
    expect(() =>
      assertChosenSourceAmounts({
        splits: splits ?? [],
        cellAmount: new Decimal(80),
        remainingByEntry: new Map([['be-50', new Decimal(50)]]),
        visibleIds: new Set(['be-50']),
      }),
    ).toThrow(/exceeds remaining bonus amount/);
  });

  it('keeps remaining 40 after 50 and 30 are taken from 50 and 70', () => {
    const first = remainingForBonusEntry({
      entry: {
        id: 'be-50',
        type: 'DELIVERY',
        amount: new Decimal(50),
        payableAmount: new Decimal(50),
        earnedPeriod: '2026-04',
      },
      releases: [
        {
          bonusEntryId: 'be-50',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(50),
        },
      ],
      payrollMonth: '2026-05',
      payrollRunId: 'pr-new',
    });
    const second = remainingForBonusEntry({
      entry: {
        id: 'be-70',
        type: 'DELIVERY',
        amount: new Decimal(70),
        payableAmount: new Decimal(70),
        earnedPeriod: '2026-04',
      },
      releases: [
        {
          bonusEntryId: 'be-70',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(30),
        },
      ],
      payrollMonth: '2026-05',
      payrollRunId: 'pr-new',
    });
    expect(first.toFixed(2)).toBe('0.00');
    expect(second.toFixed(2)).toBe('40.00');
    expect(first.plus(second).toFixed(2)).toBe('40.00');
  });
});
