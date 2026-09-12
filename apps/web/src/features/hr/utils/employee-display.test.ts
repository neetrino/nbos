import { createTranslator } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import enHr from '@/messages/en/hr.json';
import ruHr from '@/messages/ru/hr.json';
import { employeeTenure } from './employee-display';

afterEach(() => {
  vi.useRealTimers();
});

describe('employeeTenure', () => {
  it('returns an em dash without a hire date', () => {
    expect(employeeTenure(null)).toBe('—');
  });

  it('keeps the English fallback without a translator', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    expect(employeeTenure('2026-05-20T00:00:00.000Z')).toBe('New');
    expect(employeeTenure('2026-03-01T00:00:00.000Z')).toBe('3 mo');
  });

  it('formats Russian catalog months and years', () => {
    const t = createTranslator({ locale: 'ru', messages: { hr: ruHr } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    expect(
      employeeTenure('2026-03-01T00:00:00.000Z', (key, values) => t(`hr.${key}`, values)),
    ).toBe('3 мес');
    expect(
      employeeTenure('2024-01-01T00:00:00.000Z', (key, values) => t(`hr.${key}`, values)),
    ).toBe('2 г 4 мес');
  });

  it('formats English catalog years without leftover months', () => {
    const t = createTranslator({ locale: 'en', messages: { hr: enHr } });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    expect(
      employeeTenure('2024-01-01T00:00:00.000Z', (key, values) => t(`hr.${key}`, values)),
    ).toBe('2y');
  });
});
