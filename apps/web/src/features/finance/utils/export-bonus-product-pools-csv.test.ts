import { describe, expect, it } from 'vitest';
import { buildBonusProductPoolsCsvContent } from './export-bonus-product-pools-csv';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

const sample: BonusProductPoolRow = {
  poolKey: 'product:p1',
  poolKind: 'PRODUCT',
  anchorOrderId: 'ord-1',
  poolName: 'Website',
  orderCode: 'ORD-1',
  projectId: 'proj1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  entryCount: 2,
  sumPipelineAmount: '100.00',
  sumPaidAmount: '50.00',
  sumClawbackAmount: '0.00',
  sumTotalAmount: '150.00',
  ledgerPlannedAmount: '150.00',
  ledgerReleasedAmount: '0.00',
  ledgerRemainingAmount: '150.00',
  ledgerAvailableFunding: '0.00',
  ledgerOverFundingAmount: '0.00',
  ledgerReceivedAmount: '0.00',
  ledgerPoolStatus: 'ACTIVE',
  orderIds: ['ord-1'],
  orderCodes: ['ORD-1'],
  employeeCount: 2,
  fundingFillPercent: 0,
  fundingHealth: 'EMPTY',
};

describe('buildBonusProductPoolsCsvContent', () => {
  it('includes header and pool columns', () => {
    const csv = buildBonusProductPoolsCsvContent([sample]);
    expect(csv).toContain('poolKey');
    expect(csv).toContain('product:p1');
    expect(csv).toContain('Website');
  });

  it('returns header only when no rows', () => {
    const csv = buildBonusProductPoolsCsvContent([]);
    expect(csv.startsWith('poolKey,')).toBe(true);
    expect(csv.split('\r\n').length).toBe(1);
  });

  it('appends grand total row', () => {
    const row2: BonusProductPoolRow = {
      ...sample,
      poolKey: 'order:o2',
      poolKind: 'ORDER',
      poolName: 'Order ORD-2',
      orderCode: 'ORD-2',
      sumTotalAmount: '50.00',
      sumPipelineAmount: '50.00',
      sumPaidAmount: '0.00',
    };
    const csv = buildBonusProductPoolsCsvContent([sample, row2]);
    const lines = csv.split('\r\n');
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines[lines.length - 1]).toContain('_grand_total');
    expect(lines[lines.length - 1]).toContain('All pools (2)');
  });
});
