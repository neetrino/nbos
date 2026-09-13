import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import enPayroll from '@/messages/en/payroll.json';
import ruPayroll from '@/messages/ru/payroll.json';

describe('payroll catalogs', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(enPayroll).sort()).toEqual(flattenMessageKeys(ruPayroll).sort());
  });

  it('keeps ICU placeholders aligned', () => {
    expect(enPayroll.list.emptyStatus).toContain('{status}');
    expect(ruPayroll.list.emptyStatus).toContain('{status}');
    expect(enPayroll.table.totalRuns).toContain('count');
    expect(ruPayroll.table.totalRuns).toContain('count');
    expect(enPayroll.salary.employeesCount).toContain('count');
    expect(ruPayroll.salary.employeesCount).toContain('count');
    expect(enPayroll.detail.pageTitleMonth).toContain('{month}');
    expect(ruPayroll.detail.pageTitleMonth).toContain('{month}');
    expect(enPayroll.create.monthLabel).toContain('YYYY-MM');
    expect(ruPayroll.create.monthLabel).toContain('YYYY-MM');
  });

  it('formats Russian run-count plurals for 0/1/2/5/11/21', () => {
    const t = createTranslator({
      locale: 'ru',
      messages: { payroll: ruPayroll },
    });
    const samples = [
      [0, 'Итого (0 ведомостей)'],
      [1, 'Итого (1 ведомость)'],
      [2, 'Итого (2 ведомости)'],
      [5, 'Итого (5 ведомостей)'],
      [11, 'Итого (11 ведомостей)'],
      [21, 'Итого (21 ведомость)'],
    ] as const;

    for (const [count, expected] of samples) {
      expect(t('payroll.table.totalRuns', { count })).toBe(expected);
    }
  });
});
