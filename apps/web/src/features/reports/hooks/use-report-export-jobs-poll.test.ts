import { describe, expect, it } from 'vitest';
import type { ReportExportJob } from '@/lib/api/reports';
import {
  REPORT_EXPORT_JOBS_POLL_ACTIVE_MS,
  REPORT_EXPORT_JOBS_POLL_IDLE_MS,
  hasActiveReportExportJob,
  reportExportJobsPollDelayMs,
} from './use-report-export-jobs-poll';

function job(status: ReportExportJob['status']): ReportExportJob {
  return {
    id: `job-${status}`,
    reportKey: 'company-pnl',
    reportTitle: 'Company P&L',
    ownerModule: 'FINANCE',
    format: 'CSV',
    status,
    requestedById: 'user-1',
    filters: null,
    fileAssetId: null,
    fileAsset: null,
    errorMessage: null,
    queuedAt: '2026-08-20T10:00:00.000Z',
    startedAt: null,
    completedAt: null,
    failedAt: null,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  };
}

describe('hasActiveReportExportJob', () => {
  it('is true while a job is queued or processing', () => {
    expect(hasActiveReportExportJob([job('COMPLETED'), job('QUEUED')])).toBe(true);
    expect(hasActiveReportExportJob([job('PROCESSING')])).toBe(true);
  });

  it('is false when every job is finished', () => {
    expect(hasActiveReportExportJob([job('COMPLETED'), job('FAILED'), job('CANCELLED')])).toBe(
      false,
    );
    expect(hasActiveReportExportJob([])).toBe(false);
  });

  it('polls faster while a job is in flight', () => {
    expect(reportExportJobsPollDelayMs([job('QUEUED')])).toBe(REPORT_EXPORT_JOBS_POLL_ACTIVE_MS);
    expect(reportExportJobsPollDelayMs([job('COMPLETED')])).toBe(REPORT_EXPORT_JOBS_POLL_IDLE_MS);
    expect(reportExportJobsPollDelayMs([])).toBe(REPORT_EXPORT_JOBS_POLL_IDLE_MS);
  });
});
