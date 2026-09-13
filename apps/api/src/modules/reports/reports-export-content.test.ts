import { describe, expect, it } from 'vitest';
import { renderReportExportFile } from './reports-export-content';

describe('renderReportExportFile chrome', () => {
  it('localizes CSV headers and keeps payload paths as data', async () => {
    const file = await renderReportExportFile('CSV', { total: 12 }, 'ru');
    const text = Buffer.from(file.content).toString('utf8');
    expect(text.startsWith('"путь","значение"')).toBe(true);
    expect(text).toContain('"report.total","12"');
  });

  it('writes PDF chrome in the exporter locale', async () => {
    const file = await renderReportExportFile('PDF', { total: 12 }, 'ru');
    expect(file.contentType).toBe('application/pdf');
    expect(file.content.byteLength).toBeGreaterThan(500);
    const latin1 = Buffer.from(file.content).toString('latin1');
    expect(latin1).toContain('DejaVuSans');
  });
});
