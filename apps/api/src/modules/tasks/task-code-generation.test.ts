import { describe, it, expect } from 'vitest';
import { formatTaskCode } from './task-code-generation';

describe('task-code-generation', () => {
  it('formats padded code', () => {
    expect(formatTaskCode(2026, 7)).toBe('T-2026-0007');
  });

  it('grows past the padding width instead of truncating', () => {
    expect(formatTaskCode(2026, 10001)).toBe('T-2026-10001');
  });
});
