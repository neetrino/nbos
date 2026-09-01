import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertCoverageMonthFreeForCharge,
  assertCoverageMonthInManualWindow,
  assertSelectedCoverageWindowsCompatible,
  listManualInvoiceMonthKeys,
  maxManualInvoiceMonthKey,
  parseCoverageMonthKey,
  parseCoverageMonthKeys,
  SUBSCRIPTION_PERIOD_INVOICE_ERROR,
} from './subscription-period-invoice-month';

describe('parseCoverageMonthKey', () => {
  it('accepts YYYY-MM', () => {
    expect(parseCoverageMonthKey('2026-09')).toBe('2026-09');
  });

  it('rejects invalid keys', () => {
    expect(() => parseCoverageMonthKey('2026-13')).toThrow(BadRequestException);
    expect(() => parseCoverageMonthKey(undefined)).toThrow(BadRequestException);
  });
});

describe('assertCoverageMonthInManualWindow', () => {
  const now = new Date('2026-09-15T10:00:00+04:00');

  it('allows current month and a month within the next year', () => {
    expect(() =>
      assertCoverageMonthInManualWindow({
        coverageMonthKey: '2026-09',
        now,
        billingStartDate: new Date('2026-09-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).not.toThrow();
    expect(() =>
      assertCoverageMonthInManualWindow({
        coverageMonthKey: '2027-09',
        now,
        billingStartDate: new Date('2026-09-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).not.toThrow();
  });

  it('rejects months before billing start or more than 12 months ahead', () => {
    expect(() =>
      assertCoverageMonthInManualWindow({
        coverageMonthKey: '2026-08',
        now,
        billingStartDate: new Date('2026-09-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.BEFORE_START);
    expect(() =>
      assertCoverageMonthInManualWindow({
        coverageMonthKey: '2027-10',
        now,
        billingStartDate: new Date('2026-01-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.TOO_FAR);
  });
});

describe('assertCoverageMonthFreeForCharge', () => {
  it('rejects an already covered month', () => {
    expect(() =>
      assertCoverageMonthFreeForCharge({
        coverageMonthKey: '2026-09',
        coverageMonthCount: 1,
        invoices: [
          {
            type: 'SUBSCRIPTION',
            coverageStartMonth: '2026-09',
            coverageMonthCount: 1,
            createdAt: new Date('2026-09-01'),
          },
        ],
        termMonths: null,
      }),
    ).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.ALREADY_COVERED);
  });

  it('rejects when remaining term is shorter than the charge window', () => {
    expect(() =>
      assertCoverageMonthFreeForCharge({
        coverageMonthKey: '2026-09',
        coverageMonthCount: 12,
        invoices: [],
        termMonths: 6,
      }),
    ).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.TERM_REMAINING);
  });
});

describe('listManualInvoiceMonthKeys', () => {
  it('lists from billing start through the next 12 Yerevan months', () => {
    expect(
      listManualInvoiceMonthKeys({
        now: new Date('2026-09-15T10:00:00+04:00'),
        billingStartDate: new Date('2026-08-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).toEqual(monthKeysInclusive('2026-08', '2027-09'));
    expect(maxManualInvoiceMonthKey(new Date('2026-09-15T10:00:00+04:00'))).toBe('2027-09');
  });
});

describe('parseCoverageMonthKeys', () => {
  it('accepts a single coverageMonth or a unique coverageMonths list', () => {
    expect(parseCoverageMonthKeys({ coverageMonth: '2026-11' })).toEqual(['2026-11']);
    expect(parseCoverageMonthKeys({ coverageMonths: ['2026-11', '2026-09'] })).toEqual([
      '2026-09',
      '2026-11',
    ]);
  });

  it('rejects an empty or oversized list', () => {
    expect(() => parseCoverageMonthKeys({})).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.EMPTY_MONTHS);
    expect(() =>
      parseCoverageMonthKeys({
        coverageMonths: monthKeysInclusive('2026-01', '2027-01'),
      }),
    ).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.BATCH_SIZE);
  });
});

describe('assertSelectedCoverageWindowsCompatible', () => {
  it('rejects overlapping yearly starts', () => {
    expect(() =>
      assertSelectedCoverageWindowsCompatible(['2026-09', '2026-10'], 12),
    ).toThrow(SUBSCRIPTION_PERIOD_INVOICE_ERROR.SELECTED_OVERLAP);
  });

  it('allows distinct monthly starts', () => {
    expect(() => assertSelectedCoverageWindowsCompatible(['2026-09', '2026-10', '2026-11'], 1)).not.toThrow();
  });
});

function monthKeysInclusive(start: string, end: string): string[] {
  const keys: string[] = [];
  let year = Number(start.slice(0, 4));
  let month = Number(start.slice(5, 7));
  const endYear = Number(end.slice(0, 4));
  const endMonth = Number(end.slice(5, 7));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}
