import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsExportEmailService } from './reports-export-email.service';
import type { ReportExportEmailJob } from './reports-export-email.types';

const COMPLETED_JOB: ReportExportEmailJob = {
  id: 'job-1',
  reportKey: 'company-pnl',
  reportTitle: 'Company P&L',
  format: 'CSV',
  status: 'COMPLETED',
  fileAssetId: 'file-1',
  filters: { dateFrom: '2026-08-01', dateTo: '2026-08-31' },
  fileAsset: {
    id: 'file-1',
    displayName: 'pnl.csv',
    mimeType: 'text/csv',
    storageKey: 'Drive/_exports/reports/pnl.csv',
    storageProvider: 'R2',
    sizeBytes: 128,
  },
};

function createService() {
  const prisma = {
    reportSchedule: { findFirst: vi.fn().mockResolvedValue(null) },
    employee: { findMany: vi.fn(), findUnique: vi.fn() },
  };
  const audit = { log: vi.fn() };
  const driveR2 = { ensureS3: vi.fn() };
  const service = new ReportsExportEmailService(prisma as never, audit as never, driveR2 as never);
  return { service, prisma, audit, driveR2 };
}

describe('ReportsExportEmailService', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it('does not send before a Drive file exists', async () => {
    const { service, prisma, driveR2 } = createService();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await service.sendForCompletedJob(
      { ...COMPLETED_JOB, status: 'PROCESSING', fileAssetId: null, fileAsset: null },
      'employee-1',
    );
    await service.sendForCompletedJob(
      { ...COMPLETED_JOB, fileAsset: { ...COMPLETED_JOB.fileAsset!, storageKey: null } },
      'employee-1',
    );

    expect(prisma.reportSchedule.findFirst).not.toHaveBeenCalled();
    expect(driveR2.ensureS3).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send when the completed job is not linked to a schedule', async () => {
    const { service, prisma } = createService();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await service.sendForCompletedJob(COMPLETED_JOB, 'employee-1');

    expect(prisma.reportSchedule.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { lastExportJobId: 'job-1' } }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
