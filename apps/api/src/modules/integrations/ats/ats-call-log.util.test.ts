import { describe, expect, it } from 'vitest';
import { maskAtsLogValue } from './ats-call-log.util';

describe('maskAtsLogValue', () => {
  it('keeps short SIP extensions readable', () => {
    expect(maskAtsLogValue('15')).toBe('15');
    expect(maskAtsLogValue('3103585')).toBe('3103585');
  });

  it('masks external phone numbers', () => {
    expect(maskAtsLogValue('37499123456')).toBe('374***56');
    expect(maskAtsLogValue('+37499123456')).toBe('+37***56');
  });

  it('returns null for empty values', () => {
    expect(maskAtsLogValue(null)).toBeNull();
    expect(maskAtsLogValue('')).toBeNull();
  });
});
