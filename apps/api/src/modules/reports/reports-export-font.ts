import { existsSync } from 'node:fs';
import { join } from 'node:path';

const REPORT_EXPORT_FONT_FILE = 'DejaVuSans.ttf';

/** DejaVu Sans covers Latin, Cyrillic, and Armenian in generated report PDFs. */
export function resolveReportExportFontPath(): string {
  const candidates = [
    join(__dirname, 'fonts', REPORT_EXPORT_FONT_FILE),
    join(process.cwd(), 'src/modules/reports/fonts', REPORT_EXPORT_FONT_FILE),
    join(process.cwd(), 'apps/api/src/modules/reports/fonts', REPORT_EXPORT_FONT_FILE),
    join(process.cwd(), 'dist/modules/reports/fonts', REPORT_EXPORT_FONT_FILE),
    join(process.cwd(), 'apps/api/dist/modules/reports/fonts', REPORT_EXPORT_FONT_FILE),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Report PDF font missing: ${REPORT_EXPORT_FONT_FILE}`);
  }
  return found;
}
