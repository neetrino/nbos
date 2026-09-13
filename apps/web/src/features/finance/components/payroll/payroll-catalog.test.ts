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
    expect(enPayroll.matrix.cell.salesNotReady).toContain('{period}');
    expect(ruPayroll.matrix.cell.salesNotReady).toContain('{period}');
    expect(enPayroll.matrix.header.openDetailNamed).toContain('{name}');
    expect(ruPayroll.matrix.header.openDetailNamed).toContain('{name}');
    expect(enPayroll.audit.exportJournalSuccess).toContain('count');
    expect(ruPayroll.audit.exportJournalSuccess).toContain('count');
    expect(enPayroll.audit.exportAuditSuccess).toContain('count');
    expect(ruPayroll.audit.exportAuditSuccess).toContain('count');
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

  it('formats Russian journal and audit export plurals for 0/1/2/5/11/21', () => {
    const t = createTranslator({
      locale: 'ru',
      messages: { payroll: ruPayroll },
    });
    const journalSamples = [
      [0, 'Экспортировано 0 строк журнала'],
      [1, 'Экспортирована 1 строка журнала'],
      [2, 'Экспортированы 2 строки журнала'],
      [5, 'Экспортировано 5 строк журнала'],
      [11, 'Экспортировано 11 строк журнала'],
      [21, 'Экспортирована 21 строка журнала'],
    ] as const;
    const auditSamples = [
      [0, 'Экспортировано 0 строк аудита'],
      [1, 'Экспортирована 1 строка аудита'],
      [2, 'Экспортированы 2 строки аудита'],
      [5, 'Экспортировано 5 строк аудита'],
      [11, 'Экспортировано 11 строк аудита'],
      [21, 'Экспортирована 21 строка аудита'],
    ] as const;

    for (const [count, expected] of journalSamples) {
      expect(t('payroll.audit.exportJournalSuccess', { count })).toBe(expected);
    }
    for (const [count, expected] of auditSamples) {
      expect(t('payroll.audit.exportAuditSuccess', { count })).toBe(expected);
    }
  });
});
