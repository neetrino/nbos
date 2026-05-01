import { describe, it, expect, vi } from 'vitest';
import { PAYROLL_RUN_AUDIT_ENTITY_TYPE } from './payroll-run-audit.constants';
import { loadPayrollRunAuditTrail } from './payroll-run-audit-trail';

describe('loadPayrollRunAuditTrail', () => {
  it('returns empty when no audit rows', async () => {
    const auditLog = { findMany: vi.fn().mockResolvedValue([]) };
    const employee = { findMany: vi.fn() };
    const rows = await loadPayrollRunAuditTrail(
      { auditLog, employee } as never,
      PAYROLL_RUN_AUDIT_ENTITY_TYPE,
      'run-x',
    );
    expect(rows).toEqual([]);
    expect(employee.findMany).not.toHaveBeenCalled();
  });

  it('maps actors from employees', async () => {
    const auditLog = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'a1',
          action: 'STATUS_CHANGED',
          userId: 'e1',
          changes: { from: 'DRAFT', to: 'REVIEW' },
          createdAt: new Date('2026-04-01T12:00:00.000Z'),
        },
      ]),
    };
    const employee = {
      findMany: vi.fn().mockResolvedValue([{ id: 'e1', firstName: 'Z', lastName: 'Y' }]),
    };
    const rows = await loadPayrollRunAuditTrail(
      { auditLog, employee } as never,
      PAYROLL_RUN_AUDIT_ENTITY_TYPE,
      'run-1',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].actor.lastName).toBe('Y');
    expect(auditLog.findMany).toHaveBeenCalledWith({
      where: { entityType: PAYROLL_RUN_AUDIT_ENTITY_TYPE, entityId: 'run-1' },
      orderBy: { createdAt: 'asc' },
    });
  });
});
