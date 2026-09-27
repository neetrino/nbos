import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import {
  cappedCombinedSalesAccrual,
  combinedSalesAccrualAmount,
  firstProductInvoiceMinimumAmount,
  SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD,
} from './sales-bonus-combined-accrual';

describe('sales-bonus-combined-accrual', () => {
  it('adds both role rates, including when one employee holds both', () => {
    expect(
      combinedSalesAccrualAmount(new Decimal(1_000_000), new Decimal(8), new Decimal(2)).toString(),
    ).toBe('100000');
  });

  it('caps the combined amount at 300000 AMD without an 8:2 split', () => {
    const uncapped = combinedSalesAccrualAmount(
      new Decimal(3_000_000),
      new Decimal(10),
      new Decimal(2),
    );
    expect(uncapped.toString()).toBe('360000');
    expect(cappedCombinedSalesAccrual(uncapped).toString()).toBe(
      SALES_ORDER_COMBINED_ACCRUAL_CAP_AMD.toString(),
    );
  });

  it('does not reduce the invoice minimum by a KPI factor', () => {
    const minimum = firstProductInvoiceMinimumAmount(
      new Decimal(500_000),
      new Decimal(10),
      new Decimal(2),
    );
    expect(minimum.toString()).toBe('60000');
  });
});
