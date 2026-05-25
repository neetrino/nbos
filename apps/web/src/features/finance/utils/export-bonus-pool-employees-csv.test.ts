import { describe, expect, it } from 'vitest';
import { buildBonusPoolEmployeesCsvContent } from './export-bonus-pool-employees-csv';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

const pool: BonusProductPoolRow = {
  poolKey: 'product:p1',
  poolKind: 'PRODUCT',
  anchorOrderId: 'o1',
  poolName: 'Website',
  orderCode: 'ORD-1',
  projectId: 'proj1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  entryCount: 1,
  sumTotalAmount: '100',
  sumPipelineAmount: '100',
  sumPaidAmount: '0',
  sumClawbackAmount: '0',
  ledgerPlannedAmount: '100',
  ledgerReleasedAmount: '0',
  ledgerRemainingAmount: '100',
  ledgerAvailableFunding: '0',
  ledgerOverFundingAmount: '0',
  ledgerReceivedAmount: '0',
  ledgerPoolStatus: 'ACTIVE',
  orderIds: ['o1'],
  orderCodes: ['ORD-1'],
  employeeCount: 1,
  fundingFillPercent: 0,
  fundingHealth: 'EMPTY',
};

const line: BonusPoolEmployeeLine = {
  employeeId: 'e1',
  employeeName: 'Jane Seller',
  role: 'Seller',
  bonusTypes: ['SALES'],
  entryCount: 1,
  plannedAmount: '100.00',
  pipelineAmount: '100.00',
  releasedAmount: '0.00',
  includedInPayrollAmount: '0.00',
  paidAmount: '0.00',
  remainingAmount: '100.00',
  burnedAmount: '100.00',
  carryOverAmount: null,
  suggestedReleaseAmount: null,
  kpiGatePassed: false,
  primaryStatus: 'ACTIVE',
};

describe('buildBonusPoolEmployeesCsvContent', () => {
  it('includes employee rows with pool context', () => {
    const map = new Map<string, BonusPoolEmployeeLine[]>([[pool.poolKey, [line]]]);
    const csv = buildBonusPoolEmployeesCsvContent([pool], map);
    expect(csv).toContain('employeeName');
    expect(csv).toContain('Jane Seller');
    expect(csv).toContain('kpiHeldAdvisory');
    expect(csv).toContain('100.00');
  });
});
