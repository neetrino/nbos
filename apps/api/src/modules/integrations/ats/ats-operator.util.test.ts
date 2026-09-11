import { describe, expect, it } from 'vitest';
import { normalizeAtsOperatorExtension } from './ats-operator.util';

describe('normalizeAtsOperatorExtension', () => {
  it('returns a bare SIP extension', () => {
    expect(normalizeAtsOperatorExtension('3103585')).toBe('3103585');
    expect(normalizeAtsOperatorExtension(' 15 ')).toBe('15');
  });

  it('strips a channel suffix from the extension', () => {
    expect(normalizeAtsOperatorExtension('3103585-26')).toBe('3103585');
  });

  it('strips SIP/ channel prefixes', () => {
    expect(normalizeAtsOperatorExtension('SIP/3103585-26')).toBe('3103585');
  });

  it('returns null for empty op', () => {
    expect(normalizeAtsOperatorExtension(null)).toBeNull();
    expect(normalizeAtsOperatorExtension('')).toBeNull();
    expect(normalizeAtsOperatorExtension('   ')).toBeNull();
  });
});
