import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  assertBonusReleaseWithinEntryCap,
  assertOrdinaryCountingWithinSalesPayable,
  resolveBonusReleaseCap,
} from './bonus-release-entry-cap';

describe('resolveBonusReleaseCap', () => {
  it('uses the stored Sales payable instead of the entry amount', () => {
    const cap = resolveBonusReleaseCap({
      type: 'SALES',
      amount: new Decimal(200_000),
      payableAmount: new Decimal(100_000),
    });
    expect(cap.toString()).toBe('100000');
  });

  it('throws when Sales payable is held (null)', () => {
    expect(() =>
      resolveBonusReleaseCap({
        type: 'SALES',
        amount: new Decimal(200_000),
        payableAmount: null,
      }),
    ).toThrow(/held pending KPI/);
  });

  it('keeps the entry amount for Delivery with a null payable', () => {
    const cap = resolveBonusReleaseCap({
      type: 'DELIVERY',
      amount: new Decimal(200_000),
      payableAmount: null,
    });
    expect(cap.toString()).toBe('200000');
  });
});

describe('assertBonusReleaseWithinEntryCap', () => {
  it('rejects a Sales release above the stored payable', () => {
    expect(() =>
      assertBonusReleaseWithinEntryCap({
        entry: {
          type: 'SALES',
          amount: new Decimal(200_000),
          payableAmount: new Decimal(100_000),
        },
        priorCounting: new Decimal(0),
        addAmount: new Decimal(200_000),
        releaseType: 'MANUAL',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects EXTRA while Sales payable is null', () => {
    expect(() =>
      assertBonusReleaseWithinEntryCap({
        entry: {
          type: 'SALES',
          amount: new Decimal(200_000),
          payableAmount: null,
        },
        priorCounting: new Decimal(0),
        addAmount: new Decimal(200_000),
        releaseType: 'EXTRA',
      }),
    ).toThrow(/held pending KPI/);
  });

  it('rejects ordinary counting releases that together exceed payable', () => {
    expect(() =>
      assertOrdinaryCountingWithinSalesPayable(
        new Decimal(200_000),
        new Decimal(100_000),
        'Sales bonus',
      ),
    ).toThrow(/ordinary releases exceed the Sales KPI payable/);
  });

  it('lets EXTRA skip the remainder after a Sales payable is stored', () => {
    expect(() =>
      assertBonusReleaseWithinEntryCap({
        entry: {
          type: 'SALES',
          amount: new Decimal(200_000),
          payableAmount: new Decimal(100_000),
        },
        priorCounting: new Decimal(0),
        addAmount: new Decimal(200_000),
        releaseType: 'EXTRA',
      }),
    ).not.toThrow();
  });
});
