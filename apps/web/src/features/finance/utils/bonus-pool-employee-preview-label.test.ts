import { describe, expect, it } from 'vitest';
import { formatBonusPoolEmployeePreviewLine } from './bonus-pool-employee-preview-label';
import type { BonusPoolEmployeeLine } from '@/lib/api/bonus';

const line: BonusPoolEmployeeLine = {
  employeeId: 'e1',
  employeeName: 'Jane Seller',
  role: 'Seller',
  bonusTypes: ['SALES'],
  entryCount: 1,
  plannedAmount: '100000.00',
  pipelineAmount: '100000.00',
  releasedAmount: '0.00',
  includedInPayrollAmount: '0.00',
  paidAmount: '0.00',
  remainingAmount: '100000.00',
  burnedAmount: null,
  carryOverAmount: null,
  suggestedReleaseAmount: null,
  kpiGatePassed: null,
  primaryStatus: 'ACTIVE',
};

describe('formatBonusPoolEmployeePreviewLine', () => {
  it('includes name and planned amount', () => {
    const label = formatBonusPoolEmployeePreviewLine(line);
    expect(label).toContain('Jane Seller');
    expect(label).toContain('·');
  });
});
