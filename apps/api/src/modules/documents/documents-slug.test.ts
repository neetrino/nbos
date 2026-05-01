import { describe, it, expect } from 'vitest';
import { slugifyTitle } from './documents-slug';

describe('slugifyTitle', () => {
  it('returns document for empty-ish input', () => {
    expect(slugifyTitle('')).toBe('document');
    expect(slugifyTitle('   ')).toBe('document');
    expect(slugifyTitle('!!!')).toBe('document');
  });

  it('normalizes spaces and punctuation to single hyphens', () => {
    expect(slugifyTitle('  Hello   World  ')).toBe('hello-world');
    expect(slugifyTitle('a---b')).toBe('a-b');
    expect(slugifyTitle('---trim')).toBe('trim');
  });

  it('preserves unicode letters and digits', () => {
    expect(slugifyTitle('Café テスト 2024')).toBe('café-テスト-2024');
  });

  it('respects max slug length', () => {
    const long = 'a'.repeat(200);
    expect(slugifyTitle(long).length).toBeLessThanOrEqual(80);
  });
});
