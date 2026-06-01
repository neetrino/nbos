import { describe, expect, it } from 'vitest';
import { mapUeBonusPoolToProductRow } from './map-ue-bonus-pool-to-product-row';
import type { UnitEconomicsBonusPool } from '@/lib/api/unit-economics';

const basePool: UnitEconomicsBonusPool = {
  poolKey: 'order:o1',
  poolKind: 'ORDER',
  anchorOrderId: 'o1',
  poolName: 'App build',
  orderCode: 'ORD-1',
  projectId: 'p1',
  projectCode: 'PRJ',
  projectName: 'Project',
  entryCount: 2,
  employeeCount: 1,
  sumTotalAmount: '1000.00',
  sumPipelineAmount: '200.00',
  sumPaidAmount: '100.00',
  sumClawbackAmount: '0.00',
  ledgerPlannedAmount: '1000.00',
  ledgerReleasedAmount: '300.00',
  ledgerRemainingAmount: '700.00',
  ledgerAvailableFunding: '500.00',
  ledgerOverFundingAmount: '0.00',
  ledgerReceivedAmount: '800.00',
  ledgerPoolStatus: 'PARTIALLY_RELEASED',
  orderIds: ['o1'],
  orderCodes: ['ORD-1'],
  fundingHealth: 'PARTIAL',
  fundingFillPercent: 80,
};

describe('mapUeBonusPoolToProductRow', () => {
  it('maps UE pool fields to bonus sheet row shape', () => {
    const row = mapUeBonusPoolToProductRow(basePool);
    expect(row.poolKey).toBe('order:o1');
    expect(row.sumTotalAmount).toBe('1000.00');
    expect(row.ledgerAvailableFunding).toBe('500.00');
    expect(row.fundingHealth).toBe('PARTIAL');
    expect(row.orderIds).toEqual(['o1']);
  });

  it('falls back to UNKNOWN funding health for unexpected values', () => {
    const row = mapUeBonusPoolToProductRow({ ...basePool, fundingHealth: 'WEIRD' });
    expect(row.fundingHealth).toBe('UNKNOWN');
  });
});
