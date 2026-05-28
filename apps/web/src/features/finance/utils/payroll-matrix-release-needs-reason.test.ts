import { describe, expect, it } from 'vitest';
import { payrollMatrixReleaseNeedsReason } from './payroll-matrix-release-needs-reason';

describe('payrollMatrixReleaseNeedsReason', () => {
  it('requires reason when amount exceeds remaining', () => {
    expect(payrollMatrixReleaseNeedsReason(100, 80, 500)).toBe(true);
  });

  it('requires reason when amount exceeds funding', () => {
    expect(payrollMatrixReleaseNeedsReason(50, 80, 40)).toBe(true);
  });

  it('does not require reason within remaining and funding', () => {
    expect(payrollMatrixReleaseNeedsReason(50, 80, 100)).toBe(false);
  });
});
