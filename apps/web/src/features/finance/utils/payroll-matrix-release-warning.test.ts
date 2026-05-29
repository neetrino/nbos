import { describe, expect, it } from 'vitest';
import {
  matrixReleaseWarningForAmount,
  resolveMatrixReleaseWarningKind,
} from './payroll-matrix-release-warning';

describe('payroll-matrix-release-warning', () => {
  it('warns extra when amount exceeds remaining', () => {
    expect(resolveMatrixReleaseWarningKind(100, 80, 500)).toBe('EXTRA');
    expect(matrixReleaseWarningForAmount(100, 80, 500)).toBe('Extra bonus');
  });

  it('warns over funding when amount exceeds positive Avail within remaining', () => {
    expect(resolveMatrixReleaseWarningKind(50, 80, 40)).toBe('OVER_FUNDING');
    expect(matrixReleaseWarningForAmount(50, 80, 40)).toBe('Over funding');
  });

  it('does not warn within remaining when Avail is zero', () => {
    expect(resolveMatrixReleaseWarningKind(2_333, 81_000, 0)).toBeNull();
    expect(matrixReleaseWarningForAmount(2_333, 81_000, 0)).toBeNull();
  });

  it('does not warn within remaining and Avail', () => {
    expect(matrixReleaseWarningForAmount(50, 80, 100)).toBeNull();
  });
});
