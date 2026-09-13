import { describe, expect, it } from 'vitest';
import { formatGlobalSearchDate } from './global-search-presenters';

describe('formatGlobalSearchDate', () => {
  it('formats the same calendar day in the requested locale', () => {
    const now = new Date('2026-09-12T12:00:00.000Z');
    const iso = '2026-03-13T15:00:00.000Z';
    expect(formatGlobalSearchDate(iso, 'en-US', now)).toMatch(/Mar/);
    expect(formatGlobalSearchDate(iso, 'ru-RU', now)).toMatch(/мар/i);
  });
});
