import { describe, expect, it } from 'vitest';
import { REPORTS_SCHEDULE_FILES_HREF } from '../reports-schedule-display';

describe('ReportsSchedulePanel', () => {
  it('keeps a link to the report files shelf', () => {
    expect(REPORTS_SCHEDULE_FILES_HREF).toBe('/reports/center/exports');
  });
});
