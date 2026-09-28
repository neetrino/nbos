import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { computeAutoPayable } from './bonus-payable-snapshot';
import {
  allocateCappedSalesRoleAmounts,
  cappedCombinedSalesAccrual,
  combinedSalesAccrualAmount,
  firstProductInvoiceMinimumAmount,
  remainingSalesOrderAccrualCap,
  SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD,
  uncappedSalesRoleAmount,
  type CappedSalesRoleAmounts,
} from './sales-bonus-combined-accrual';

const MILLION = new Decimal(1_000_000);
const RATE_EIGHT = new Decimal(8);
const RATE_TWO = new Decimal(2);
const RATE_FORTY = new Decimal(40);
const RATE_TEN = new Decimal(10);

function allocateFromRates(
  baseAmount: Decimal,
  sellerPercent: Decimal,
  assistantPercent: Decimal,
  cap?: Decimal,
): CappedSalesRoleAmounts {
  return allocateCappedSalesRoleAmounts({
    sellerUncapped: uncappedSalesRoleAmount(baseAmount, sellerPercent),
    assistantUncapped: uncappedSalesRoleAmount(baseAmount, assistantPercent),
    cap,
  });
}

describe('sales-bonus-combined-accrual', () => {
  it('adds both role rates, including when one employee holds both', () => {
    expect(combinedSalesAccrualAmount(MILLION, RATE_EIGHT, RATE_TWO).toString()).toBe('100000');
  });

  it('caps the combined amount at 300000 AMD without an 8:2 split', () => {
    const uncapped = combinedSalesAccrualAmount(new Decimal(3_000_000), RATE_TEN, RATE_TWO);
    expect(uncapped.toString()).toBe('360000');
    expect(cappedCombinedSalesAccrual(uncapped).toString()).toBe(
      SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD.toString(),
    );
  });

  it('does not reduce the invoice minimum by a KPI factor', () => {
    const minimum = firstProductInvoiceMinimumAmount(new Decimal(500_000), RATE_TEN, RATE_TWO);
    expect(minimum.toString()).toBe('60000');
  });

  it('keeps 80000 and 20000 when 8% and 2% stay under the cap', () => {
    const allocated = allocateFromRates(MILLION, RATE_EIGHT, RATE_TWO);
    expect(allocated.sellerAmount.toString()).toBe('80000');
    expect(allocated.assistantAmount.toString()).toBe('20000');
  });

  it('splits 240000 and 60000 when 40% and 10% exceed the cap', () => {
    const allocated = allocateFromRates(MILLION, RATE_FORTY, RATE_TEN);
    expect(allocated.sellerAmount.toString()).toBe('240000');
    expect(allocated.assistantAmount.toString()).toBe('60000');
    expect(allocated.sellerAmount.plus(allocated.assistantAmount).toString()).toBe('300000');
  });

  it('uses the same 8:2 split when the uncapped 8% and 2% wave exceeds the cap', () => {
    const allocated = allocateFromRates(new Decimal(4_000_000), RATE_EIGHT, RATE_TWO);
    expect(allocated.sellerAmount.toString()).toBe('240000');
    expect(allocated.assistantAmount.toString()).toBe('60000');
  });

  it('assigns rounding residue to Assistant so the components equal the cap', () => {
    const allocated = allocateFromRates(new Decimal(5_000_000), new Decimal(7), RATE_TWO);
    expect(allocated.sellerAmount.toString()).toBe('233333.33');
    expect(allocated.assistantAmount.toString()).toBe('66666.67');
    expect(allocated.sellerAmount.plus(allocated.assistantAmount).toString()).toBe('300000');
  });

  it('applies KPI 0.5 after the cap, not to the uncapped 400000 share', () => {
    const allocated = allocateFromRates(MILLION, RATE_FORTY, RATE_TEN);
    expect(allocated.sellerAmount.toString()).toBe('240000');
    expect(computeAutoPayable(allocated.sellerAmount, new Decimal('0.5')).toString()).toBe(
      '120000',
    );
    expect(computeAutoPayable(new Decimal(400_000), new Decimal('0.5')).toString()).not.toBe(
      '120000',
    );
  });

  it('returns a zero remaining envelope after 300000 is already stored', () => {
    expect(remainingSalesOrderAccrualCap(new Decimal(300_000)).toString()).toBe('0');
    const allocated = allocateFromRates(MILLION, RATE_FORTY, RATE_TEN, new Decimal(0));
    expect(allocated.sellerAmount.toString()).toBe('0');
    expect(allocated.assistantAmount.toString()).toBe('0');
  });

  it('splits a later invoice by its own rates against the remaining 200000', () => {
    const remaining = remainingSalesOrderAccrualCap(new Decimal(100_000));
    expect(remaining.toString()).toBe('200000');
    const allocated = allocateFromRates(MILLION, RATE_FORTY, RATE_TEN, remaining);
    expect(allocated.sellerAmount.toString()).toBe('160000');
    expect(allocated.assistantAmount.toString()).toBe('40000');
  });

  it('assigns rounding residue to Assistant when independent rounding would exceed the remainder', () => {
    const allocated = allocateCappedSalesRoleAmounts({
      sellerUncapped: new Decimal('50.005'),
      assistantUncapped: new Decimal('49.995'),
      cap: new Decimal('100.00'),
    });
    expect(allocated.sellerAmount.toString()).toBe('50.01');
    expect(allocated.assistantAmount.toString()).toBe('49.99');
    expect(allocated.sellerAmount.plus(allocated.assistantAmount).toString()).toBe('100');
  });
});
