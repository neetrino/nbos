import { describe, expect, it } from 'vitest';
import { resolveNamedCodeLabel } from './task-link-display-names.op';

describe('resolveNamedCodeLabel', () => {
  it('prefers a trimmed name over code for lead/deal chips', () => {
    expect(resolveNamedCodeLabel({ name: '  Acme inquiry  ', code: 'L-1' })).toBe('Acme inquiry');
  });

  it('falls back to code when name is empty', () => {
    expect(resolveNamedCodeLabel({ name: '   ', code: 'L-22' })).toBe('L-22');
    expect(resolveNamedCodeLabel({ name: null, code: 'D-9' })).toBe('D-9');
  });
});
