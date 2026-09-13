import { describe, expect, it } from 'vitest';
import {
  buildReportExportEmailHtml,
  buildReportExportEmailSubject,
  buildReportExportPeriodLabel,
} from './reports-export-email-html';

describe('report export email chrome', () => {
  it('localizes the subject and period fallback', () => {
    expect(buildReportExportEmailSubject('Company P&L', 'CSV', 'ru')).toBe(
      'Company P&L — отчёт CSV готов',
    );
    expect(buildReportExportPeriodLabel(null, 'ru')).toBe('Текущие даты отчёта');
    expect(buildReportExportPeriodLabel({ asOf: '2026-08-01' }, 'ru')).toBe('На 2026-08-01');
  });

  it('keeps report title as data and translates labels', () => {
    const html = buildReportExportEmailHtml({
      reportTitle: 'Company P&L',
      format: 'CSV',
      fileName: 'pnl.csv',
      generatedAt: new Date('2026-09-13T12:00:00.000Z'),
      periodLabel: '2026-08-01 – 2026-08-31',
      filesHref: 'https://nbos.test/reports/center/exports',
      locale: 'ru',
    });
    expect(html).toContain('Company P&amp;L');
    expect(html).toContain('Отчёты NBOS');
    expect(html).toContain('Открыть файлы отчётов');
    expect(html).toContain('Формат');
  });
});
