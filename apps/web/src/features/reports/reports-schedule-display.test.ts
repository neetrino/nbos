import { describe, expect, it } from 'vitest';
import type { ReportSchedule } from '@/lib/api/reports';
import {
  REPORTS_SCHEDULE_FILES_HREF,
  reportScheduleFiltersSummary,
  reportScheduleRecipientsSummary,
  reportScheduleRecurrenceSummary,
} from './reports-schedule-display';

function schedule(
  overrides: Partial<
    Pick<ReportSchedule, 'frequency' | 'timeOfDay' | 'timezone' | 'dayOfWeek' | 'dayOfMonth'>
  >,
): ReportSchedule {
  return {
    id: 'sch-1',
    reportKey: 'company-pnl',
    reportTitle: 'Company P&L',
    ownerModule: 'FINANCE',
    format: 'CSV',
    status: 'ACTIVE',
    ownerId: 'user-1',
    recipientEmails: ['owner@example.com'],
    recipientRoles: ['OWNER', 'CEO'],
    scheduleLabel: 'Monthly packet',
    filters: null,
    frequency: 'MONTHLY',
    timezone: 'Asia/Yerevan',
    timeOfDay: '09:00',
    startDate: '2026-08-01T00:00:00.000Z',
    dayOfWeek: null,
    dayOfMonth: 1,
    nextRunAt: '2026-09-01T05:00:00.000Z',
    lastRunAt: null,
    lastExportJobId: null,
    lastFailureAt: null,
    failureReason: null,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('reportScheduleFiltersSummary', () => {
  it('lists set dates and ignores empty values', () => {
    expect(reportScheduleFiltersSummary({ dateFrom: '2026-08-01', dateTo: '', asOf: null })).toBe(
      'dateFrom: 2026-08-01',
    );
    expect(reportScheduleFiltersSummary({})).toBe('none');
  });
});

describe('reportScheduleRecurrenceSummary', () => {
  it('describes daily, weekly and monthly plans', () => {
    expect(reportScheduleRecurrenceSummary(schedule({ frequency: 'DAILY' }))).toBe(
      'Daily at 09:00 (Asia/Yerevan)',
    );
    expect(reportScheduleRecurrenceSummary(schedule({ frequency: 'WEEKLY', dayOfWeek: 1 }))).toBe(
      'Weekly on Monday at 09:00 (Asia/Yerevan)',
    );
    expect(reportScheduleRecurrenceSummary(schedule({ frequency: 'MONTHLY', dayOfMonth: 1 }))).toBe(
      'Monthly on day 1 at 09:00 (Asia/Yerevan)',
    );
  });
});

describe('reportScheduleRecipientsSummary', () => {
  it('shows Owner and CEO together from selected roles', () => {
    expect(reportScheduleRecipientsSummary(schedule({}))).toBe('Owner, CEO');
  });
});

describe('REPORTS_SCHEDULE_FILES_HREF', () => {
  it('points at the report files shelf', () => {
    expect(REPORTS_SCHEDULE_FILES_HREF).toBe('/reports/center/exports');
  });
});
