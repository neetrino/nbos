import { describe, expect, it } from 'vitest';
import { formatInvoiceSheetDate } from './format-invoice-sheet-date';

describe('formatInvoiceSheetDate', () => {
  it('formats a valid date in English and Russian', () => {
    const iso = '2026-09-15T12:00:00.000Z';
    const en = formatInvoiceSheetDate(iso, 'en');
    const ru = formatInvoiceSheetDate(iso, 'ru');
    expect(en).not.toBe(iso);
    expect(ru.toLowerCase()).toMatch(/сент/);
    expect(ru).not.toBe(en);
  });

  it('returns the original value when the date is invalid', () => {
    expect(formatInvoiceSheetDate('not-a-date', 'en')).toBe('not-a-date');
  });
});
