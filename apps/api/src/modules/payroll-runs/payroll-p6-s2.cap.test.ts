import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { buildSalesBonusAmountRows } from '../bonus/sales-bonus-accrual-rows';
import {
  allocateCappedSalesRoleAmounts,
  cappedCombinedSalesAccrual,
  combinedSalesAccrualAmount,
  remainingSalesOrderAccrualCap,
  uncappedSalesRoleAmount,
} from '../bonus/sales-bonus-combined-accrual';
import {
  P6_S2_ASSISTANT_PERCENT,
  P6_S2_CAP_ASSISTANT,
  P6_S2_CAP_COMBINED,
  P6_S2_CAP_EXCESS,
  P6_S2_CAP_REMAINING_ENVELOPE,
  P6_S2_CAP_SELLER,
  P6_S2_ORDER_BASE,
  P6_S2_ORDER_CAP,
  P6_S2_SAME_PERSON_TOTAL,
  P6_S2_SELLER_PERCENT,
} from './payroll-p6-s2-expected.amounts';

describe('P6-S2 V-19 combined Seller + Assistant 300000 cap', () => {
  it('splits 240000 and 60000 by actual 8:2 proportions before KPI', () => {
    const allocated = allocateCappedSalesRoleAmounts({
      sellerUncapped: uncappedSalesRoleAmount(P6_S2_ORDER_BASE, P6_S2_SELLER_PERCENT),
      assistantUncapped: uncappedSalesRoleAmount(P6_S2_ORDER_BASE, P6_S2_ASSISTANT_PERCENT),
    });
    const combined = combinedSalesAccrualAmount(
      P6_S2_ORDER_BASE,
      P6_S2_SELLER_PERCENT,
      P6_S2_ASSISTANT_PERCENT,
    );

    expect(allocated.sellerAmount.toFixed(2)).toBe(P6_S2_CAP_SELLER.toFixed(2));
    expect(allocated.assistantAmount.toFixed(2)).toBe(P6_S2_CAP_ASSISTANT.toFixed(2));
    expect(allocated.sellerAmount.plus(allocated.assistantAmount).toFixed(2)).toBe(
      P6_S2_CAP_COMBINED.toFixed(2),
    );
    expect(cappedCombinedSalesAccrual(combined).toFixed(2)).toBe(P6_S2_ORDER_CAP.toFixed(2));
    expect(combined.toFixed(2)).not.toBe(P6_S2_CAP_COMBINED.toFixed(2));
  });

  it('keeps one 300000 envelope when one person holds both roles', () => {
    const rows = buildSalesBonusAmountRows(
      { sellerId: 'emp-both', sellerAssistantId: 'emp-both' },
      { sellerPercent: P6_S2_SELLER_PERCENT, assistantPercent: P6_S2_ASSISTANT_PERCENT },
      P6_S2_ORDER_BASE,
    );
    const total = rows.reduce((sum, row) => sum.plus(row.amount), new Decimal('0'));

    expect(rows).toHaveLength(2);
    expect(rows[0]?.employeeId).toBe('emp-both');
    expect(rows[1]?.employeeId).toBe('emp-both');
    expect(rows[0]?.amount.toFixed(2)).toBe(P6_S2_CAP_SELLER.toFixed(2));
    expect(rows[1]?.amount.toFixed(2)).toBe(P6_S2_CAP_ASSISTANT.toFixed(2));
    expect(total.toFixed(2)).toBe(P6_S2_SAME_PERSON_TOTAL.toFixed(2));
    expect(total.toFixed(2)).toBe(P6_S2_ORDER_CAP.toFixed(2));
  });

  it('does not keep amount above 300000 as later payable', () => {
    const remaining = remainingSalesOrderAccrualCap(P6_S2_CAP_COMBINED);
    const later = allocateCappedSalesRoleAmounts({
      sellerUncapped: uncappedSalesRoleAmount(P6_S2_ORDER_BASE, P6_S2_SELLER_PERCENT),
      assistantUncapped: uncappedSalesRoleAmount(P6_S2_ORDER_BASE, P6_S2_ASSISTANT_PERCENT),
      cap: remaining,
    });

    expect(remaining.toFixed(2)).toBe(P6_S2_CAP_REMAINING_ENVELOPE.toFixed(2));
    expect(P6_S2_CAP_EXCESS.toFixed(2)).toBe('700000.00');
    expect(later.sellerAmount.toFixed(2)).toBe('0.00');
    expect(later.assistantAmount.toFixed(2)).toBe('0.00');
  });
});
