import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  assertCoverageMonthFreeForCharge,
  assertCoverageMonthInManualWindow,
  listManualInvoiceMonthKeys,
  maxManualInvoiceMonthKey,
  parseCoverageMonthKey,
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

  it('allows current and next month after billing start', () => {
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
        coverageMonthKey: '2026-10',
        now,
        billingStartDate: new Date('2026-09-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).not.toThrow();
  });

  it('rejects months before billing start or after next month', () => {
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
        coverageMonthKey: '2026-11',
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
  it('lists from billing start through next Yerevan month', () => {
    expect(
      listManualInvoiceMonthKeys({
        now: new Date('2026-09-15T10:00:00+04:00'),
        billingStartDate: new Date('2026-08-01T00:00:00+04:00'),
        endDate: null,
      }),
    ).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(maxManualInvoiceMonthKey(new Date('2026-09-15T10:00:00+04:00'))).toBe('2026-10');
  });
});
