import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@nbos/database';
import {
  applySubscriptionBillingPatch,
  assertTermMonthsAlignWithCoverage,
  parseOptionalTermMonths,
  resolveSubscriptionBillingInput,
} from './subscription-billing-dto';

describe('assertTermMonthsAlignWithCoverage', () => {
  it('accepts term that divides into whole billing periods', () => {
    expect(() => assertTermMonthsAlignWithCoverage(6, 1)).not.toThrow();
    expect(() => assertTermMonthsAlignWithCoverage(12, 12)).not.toThrow();
    expect(() => assertTermMonthsAlignWithCoverage(6, 3)).not.toThrow();
  });

  it('rejects coverage longer than the term', () => {
    expect(() => assertTermMonthsAlignWithCoverage(6, 12)).toThrow(BadRequestException);
  });

  it('rejects term that does not divide by coverageMonthCount', () => {
    expect(() => assertTermMonthsAlignWithCoverage(6, 4)).toThrow(BadRequestException);
  });
});

describe('parseOptionalTermMonths', () => {
  it('allows null open-ended term', () => {
    expect(parseOptionalTermMonths(null)).toBeNull();
  });
});

describe('resolveSubscriptionBillingInput', () => {
  it('requires billingFrequency on create (no silent MONTHLY default)', () => {
    expect(() =>
      resolveSubscriptionBillingInput({
        amount: 1000,
        billingStartDate: '2026-01-01',
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      resolveSubscriptionBillingInput({
        amount: 1000,
        billingStartDate: '2026-01-01',
        billingFrequency: '   ',
      }),
    ).toThrow(/billingFrequency is required/);
  });

  it('resolves when billingFrequency is provided', () => {
    const billing = resolveSubscriptionBillingInput({
      amount: 1000,
      billingStartDate: '2026-01-01',
      billingFrequency: 'MONTHLY',
    });
    expect(billing.billingFrequency).toBe('MONTHLY');
    expect(billing.coverageMonthCount).toBe(1);
    expect(() => assertTermMonthsAlignWithCoverage(6, billing.coverageMonthCount)).not.toThrow();
  });
});

describe('applySubscriptionBillingPatch', () => {
  it('leaves billingFrequency untouched when omitted on update', () => {
    const updateData: Prisma.SubscriptionUpdateInput = {};
    applySubscriptionBillingPatch({ amount: 2000 }, updateData);
    expect(updateData.amount).toBe(2000);
    expect(updateData.billingFrequency).toBeUndefined();
    expect(updateData.coverageMonthCount).toBeUndefined();
  });

  it('updates frequency when explicitly provided', () => {
    const updateData: Prisma.SubscriptionUpdateInput = {};
    applySubscriptionBillingPatch({ billingFrequency: 'YEARLY' }, updateData);
    expect(updateData.billingFrequency).toBe('YEARLY');
    expect(updateData.coverageMonthCount).toBe(12);
  });
});
