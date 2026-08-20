import { describe, expect, it } from 'vitest';
import type { ReportExportJob } from '@/lib/api/reports';
import {
  canCancelReportExport,
  canDownloadReportExport,
  canRetryReportExport,
  isActiveReportExport,
} from './report-export-job-actions';

function job(
  status: ReportExportJob['status'],
  fileAssetId?: string,
): Pick<ReportExportJob, 'status' | 'fileAsset'> {
  return {
    status,
    fileAsset: fileAssetId ? ({ id: fileAssetId } as ReportExportJob['fileAsset']) : null,
  };
}

describe('report export job actions', () => {
  it('allows download only when the job completed with a Drive file', () => {
    expect(canDownloadReportExport(job('COMPLETED', 'file-1'))).toBe(true);
    expect(canDownloadReportExport(job('COMPLETED'))).toBe(false);
    expect(canDownloadReportExport(job('PROCESSING', 'file-1'))).toBe(false);
    expect(canDownloadReportExport(job('QUEUED'))).toBe(false);
  });

  it('allows retry only for failed or cancelled jobs', () => {
    expect(canRetryReportExport(job('FAILED'))).toBe(true);
    expect(canRetryReportExport(job('CANCELLED'))).toBe(true);
    expect(canRetryReportExport(job('COMPLETED', 'file-1'))).toBe(false);
    expect(canRetryReportExport(job('QUEUED'))).toBe(false);
  });

  it('treats queued and processing jobs as active and cancellable', () => {
    expect(isActiveReportExport(job('QUEUED'))).toBe(true);
    expect(isActiveReportExport(job('PROCESSING'))).toBe(true);
    expect(canCancelReportExport(job('QUEUED'))).toBe(true);
    expect(canCancelReportExport(job('PROCESSING'))).toBe(true);
    expect(isActiveReportExport(job('COMPLETED'))).toBe(false);
    expect(canCancelReportExport(job('FAILED'))).toBe(false);
  });
});
