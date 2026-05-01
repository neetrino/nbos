import { describe, it, expect } from 'vitest';
import {
  extractMaterializedExpenseIds,
  formatPayrollAuditChangesBody,
} from './payroll-audit-changes-display';

describe('payroll-audit-changes-display', () => {
  it('extractMaterializedExpenseIds filters strings', () => {
    expect(
      extractMaterializedExpenseIds({
        from: 'REVIEW',
        to: 'APPROVED',
        materializedExpenseIds: ['e1', '  ', 2 as unknown as number],
      }),
    ).toEqual(['e1']);
  });

  it('formatPayrollAuditChangesBody omits materializedExpenseIds', () => {
    const text = formatPayrollAuditChangesBody({
      from: 'REVIEW',
      to: 'APPROVED',
      materializedExpenseIds: ['a', 'b'],
    });
    expect(text).toContain('"from"');
    expect(text).toContain('"to"');
    expect(text).not.toContain('materializedExpenseIds');
  });
});
