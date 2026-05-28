import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { resolveMatrixReleaseType } from './payroll-matrix-cell-patch';

describe('resolveMatrixReleaseType', () => {
  it('returns OVER_FUNDING when amount exceeds available funding', () => {
    expect(resolveMatrixReleaseType(new Decimal(100), new Decimal(50), new Decimal(80))).toBe(
      'OVER_FUNDING',
    );
  });

  it('returns EXTRA when amount exceeds remaining but within funding', () => {
    expect(resolveMatrixReleaseType(new Decimal(100), new Decimal(50), new Decimal(200))).toBe(
      'EXTRA',
    );
  });

  it('returns MANUAL for normal partial release', () => {
    expect(resolveMatrixReleaseType(new Decimal(40), new Decimal(50), new Decimal(200))).toBe(
      'MANUAL',
    );
  });
});
