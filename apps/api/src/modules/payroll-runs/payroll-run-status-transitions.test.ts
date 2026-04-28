import { describe, it, expect } from 'vitest';
import { canTransitionPayrollRun } from './payroll-run-status-transitions';

describe('canTransitionPayrollRun', () => {
  it('allows DRAFT → REVIEW', () => {
    expect(canTransitionPayrollRun('DRAFT', 'REVIEW')).toBe(true);
  });

  it('allows REVIEW → APPROVED', () => {
    expect(canTransitionPayrollRun('REVIEW', 'APPROVED')).toBe(true);
  });

  it('allows REVIEW → DRAFT', () => {
    expect(canTransitionPayrollRun('REVIEW', 'DRAFT')).toBe(true);
  });

  it('rejects DRAFT → APPROVED', () => {
    expect(canTransitionPayrollRun('DRAFT', 'APPROVED')).toBe(false);
  });

  it('rejects CLOSED transitions', () => {
    expect(canTransitionPayrollRun('CLOSED', 'DRAFT')).toBe(false);
  });
});
