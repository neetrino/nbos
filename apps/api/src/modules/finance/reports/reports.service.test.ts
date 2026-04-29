import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { FinanceReportsService } from './reports.service';

describe('FinanceReportsService', () => {
  const service = new FinanceReportsService();

  it('returns the six Phase 3 v1 definitions', () => {
    const result = service.getDefinitions();

    expect(result.meta.count).toBe(6);
    expect(result.items.map((item) => item.id)).toEqual([
      'company-pnl',
      'project-pnl',
      'cash-flow',
      'mrr-subscription-revenue',
      'expense-plan-vs-actual',
      'payroll-report',
    ]);
  });

  it('keeps Phase 6 boundary explicit', () => {
    expect(service.getDefinitions().meta.phase6Boundary).toContain('Phase 6');
  });

  it('throws for unknown definition ids', () => {
    expect(() => service.getDefinition('unknown')).toThrow(NotFoundException);
  });
});
