import { describe, expect, it } from 'vitest';
import {
  payrollMatrixReleaseNeedsReason,
  resolveMatrixReleaseExceptionKind,
} from './payroll-matrix-release-needs-reason';

describe('payrollMatrixReleaseNeedsReason', () => {
  it('requires reason when amount exceeds remaining', () => {
    expect(payrollMatrixReleaseNeedsReason(100, 80, 500)).toBe(true);
    expect(resolveMatrixReleaseExceptionKind(100, 80, 500)).toBe('EXTRA');
  });

  it('requires reason when amount exceeds positive funding within remaining', () => {
    expect(payrollMatrixReleaseNeedsReason(50, 80, 40)).toBe(true);
    expect(resolveMatrixReleaseExceptionKind(50, 80, 40)).toBe('OVER_FUNDING');
  });

  it('does not require reason within remaining when funding is zero', () => {
    expect(payrollMatrixReleaseNeedsReason(2_333, 81_000, 0)).toBe(false);
    expect(resolveMatrixReleaseExceptionKind(2_333, 81_000, 0)).toBeNull();
  });

  it('does not require reason within remaining and funding', () => {
    expect(payrollMatrixReleaseNeedsReason(50, 80, 100)).toBe(false);
  });
});
