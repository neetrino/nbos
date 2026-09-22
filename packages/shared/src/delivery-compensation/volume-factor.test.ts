import { describe, expect, it } from 'vitest';
import {
  parseVolumeAdjustment,
  scaleMoney,
  scaleUnits,
  VOLUME_FACTOR_STANDARD,
} from './volume-factor';

describe('parseVolumeAdjustment', () => {
  it('keeps the standard step and drops the reason', () => {
    expect(parseVolumeAdjustment('1.0', 'not needed here')).toEqual({
      volumeFactor: VOLUME_FACTOR_STANDARD,
      volumeReason: null,
    });
    expect(parseVolumeAdjustment(1, 'ignored')).toEqual({
      volumeFactor: VOLUME_FACTOR_STANDARD,
      volumeReason: null,
    });
  });

  it('accepts a tenth and requires an explanation', () => {
    expect(parseVolumeAdjustment('1.5', '  harder core than the catalog shop  ')).toEqual({
      volumeFactor: '1.5',
      volumeReason: 'harder core than the catalog shop',
    });
    expect(parseVolumeAdjustment('0.5', 'minimal shop, half the core')).toEqual({
      volumeFactor: '0.5',
      volumeReason: 'minimal shop, half the core',
    });
  });

  it('rejects a value off the step or outside 0.5–2.0', () => {
    expect(() => parseVolumeAdjustment('1.15', 'not a step')).toThrow(/step/);
    expect(() => parseVolumeAdjustment('3', 'too large for a line')).toThrow(/step/);
    expect(() => parseVolumeAdjustment('1.5', 'short')).toThrow(/volumeReason/);
  });
});

describe('scaleUnits and scaleMoney', () => {
  it('multiplies units and money by the same factor', () => {
    expect(scaleUnits('10.0000', '1.5')).toBe('15.0000');
    expect(scaleMoney('100.00', '0.5')).toBe('50.00');
    expect(scaleUnits('7.0000', '1.0')).toBe('7.0000');
  });
});
