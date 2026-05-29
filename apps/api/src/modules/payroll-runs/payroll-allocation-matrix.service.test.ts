import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import { resolvePayrollMatrixCellState } from './payroll-allocation-matrix.service';

describe('resolvePayrollMatrixCellState', () => {
  it('shows ready bonus entries as ready even before an amount is drafted', () => {
    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: true,
        releaseAmount: new Decimal(0),
        remaining: new Decimal(50_000),
        availableFunding: new Decimal(100_000),
        deliveryOpen: false,
        manualBonus: false,
      }),
    ).toBe('READY');
  });

  it('keeps unfinished delivery bonus cells blue until an amount is drafted', () => {
    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: true,
        releaseAmount: new Decimal(0),
        remaining: new Decimal(50_000),
        availableFunding: new Decimal(100_000),
        deliveryOpen: true,
        manualBonus: false,
      }),
    ).toBe('LINKED_EMPTY');
  });

  it('shows delivery progress payouts as a normal green state', () => {
    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: true,
        releaseAmount: new Decimal(10_000),
        remaining: new Decimal(50_000),
        availableFunding: new Decimal(100_000),
        deliveryOpen: true,
        manualBonus: false,
      }),
    ).toBe('PROGRESS');
  });

  it('shows ready bonuses without full funding as partially funded', () => {
    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: true,
        releaseAmount: new Decimal(10_000),
        remaining: new Decimal(50_000),
        availableFunding: new Decimal(20_000),
        deliveryOpen: false,
        manualBonus: false,
      }),
    ).toBe('PARTIALLY_FUNDED');
  });

  it('keeps manual bonus entries visually distinct', () => {
    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: false,
        releaseAmount: new Decimal(10_000),
        remaining: new Decimal(0),
        availableFunding: new Decimal(100_000),
        deliveryOpen: true,
        manualBonus: true,
      }),
    ).toBe('MANUAL_BONUS');
  });

  it('keeps extra and over-funding warnings above normal states', () => {
    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: true,
        releaseAmount: new Decimal(60_000),
        remaining: new Decimal(50_000),
        availableFunding: new Decimal(100_000),
        deliveryOpen: true,
        manualBonus: false,
      }),
    ).toBe('EXTRA_BONUS');

    expect(
      resolvePayrollMatrixCellState({
        linked: true,
        hasBonusEntry: true,
        releaseAmount: new Decimal(60_000),
        remaining: new Decimal(100_000),
        availableFunding: new Decimal(50_000),
        deliveryOpen: false,
        manualBonus: false,
      }),
    ).toBe('OVER_FUNDING');
  });
});
