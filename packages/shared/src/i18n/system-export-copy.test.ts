import { describe, expect, it } from 'vitest';
import { reportExportFileCopy } from './system-export-copy';

describe('report export file copy', () => {
  it('keeps English chrome as the default', () => {
    expect(reportExportFileCopy('en').title).toBe('Report Export');
    expect(reportExportFileCopy('de').path).toBe('path');
  });

  it('localizes spreadsheet headers and PDF chrome', () => {
    expect(reportExportFileCopy('ru')).toMatchObject({
      title: 'Экспорт отчёта',
      path: 'путь',
      value: 'значение',
      sheetName: 'Отчёт',
    });
    expect(reportExportFileCopy('hy').title).toBe('Հաշվետվության արտահանում');
    expect(reportExportFileCopy('ru').generatedAt).toContain('{iso}');
    expect(reportExportFileCopy('hy').generatedAt).toContain('{iso}');
  });
});
