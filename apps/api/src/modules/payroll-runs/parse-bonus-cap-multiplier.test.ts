import { describe, expect, it } from 'vitest';
import { Decimal } from '@nbos/database';

import {
  defaultBonusCapBaseSalaryMultiplier,
  parseBonusCapBaseSalaryMultiplier,
} from './parse-bonus-cap-multiplier';

describe('parseBonusCapBaseSalaryMultiplier', () => {
  it('defaults when null', () => {
    expect(parseBonusCapBaseSalaryMultiplier(null).toString()).toBe('2');
  });

  it('clamps above max', () => {
    expect(parseBonusCapBaseSalaryMultiplier(5).toString()).toBe('3');
  });

  it('defaults below min', () => {
    expect(parseBonusCapBaseSalaryMultiplier(0.5).toString()).toBe('2');
  });

  it('rounds to two decimals', () => {
    expect(parseBonusCapBaseSalaryMultiplier('2.555').toString()).toBe('2.56');
  });

  it('defaultBonusCapBaseSalaryMultiplier matches platform default', () => {
    expect(defaultBonusCapBaseSalaryMultiplier()).toEqual(new Decimal(2));
  });
});
