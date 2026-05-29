import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { resolveMatrixReleaseType } from './payroll-matrix-cell-patch';

describe('resolveMatrixReleaseType', () => {
  it('returns EXTRA when amount exceeds remaining', () => {
    expect(resolveMatrixReleaseType(new Decimal(100), new Decimal(50), new Decimal(80))).toBe(
      'EXTRA',
    );
  });

  it('returns OVER_FUNDING when amount exceeds positive funding within remaining', () => {
    expect(resolveMatrixReleaseType(new Decimal(60), new Decimal(80), new Decimal(50))).toBe(
      'OVER_FUNDING',
    );
  });

  it('returns MANUAL within remaining when funding is zero', () => {
    expect(resolveMatrixReleaseType(new Decimal(2_333), new Decimal(81_000), new Decimal(0))).toBe(
      'MANUAL',
    );
  });

  it('returns MANUAL for normal partial release', () => {
    expect(resolveMatrixReleaseType(new Decimal(40), new Decimal(50), new Decimal(200))).toBe(
      'MANUAL',
    );
  });
});
