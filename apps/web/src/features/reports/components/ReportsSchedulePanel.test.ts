import { describe, expect, it } from 'vitest';
import { buildReportsViewPath } from '@/features/reports/reports-routing';
import { REPORTS_SCHEDULE_FILES_HREF } from './ReportsSchedulePanel';

describe('ReportsSchedulePanel', () => {
  it('sends leftover scheduled URLs to the report files shelf', () => {
    expect(REPORTS_SCHEDULE_FILES_HREF).toBe(buildReportsViewPath('EXPORTS'));
    expect(REPORTS_SCHEDULE_FILES_HREF).toBe('/reports/center/exports');
  });
});
