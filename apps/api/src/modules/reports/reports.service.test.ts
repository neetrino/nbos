import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { DriveService } from '../drive/drive.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { ReportsQueueService } from './reports-queue.service';
import { ReportsService } from './reports.service';

function createAuditService(): Partial<AuditService> {
  return { log: vi.fn() };
}

function createDriveService(): Partial<DriveService> {
  return {
    createGeneratedFileAsset: vi.fn().mockResolvedValue({ id: 'file-1' }),
  };
}

function createReportsQueueService(): Partial<ReportsQueueService> {
  return { enqueueExport: vi.fn().mockResolvedValue(true) };
}

const QUEUED_JOB = {
  id: 'job-1',
  reportKey: 'company-pnl',
  reportTitle: 'Company P&L',
  ownerModule: 'FINANCE',
  format: 'CSV',
  requestedById: 'employee-1',
  filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
};

const FAILED_JOB = {
  ...QUEUED_JOB,
  id: 'job-failed',
  status: 'FAILED',
  errorMessage: 'Worker failed',
};

const FINANCE_PERMISSIONS = {
  FINANCE_INVOICES_VIEW: 'ALL',
};

const CROSS_MODULE_PERMISSIONS = {
  ...FINANCE_PERMISSIONS,
  CRM_LEADS_VIEW: 'ALL',
};

describe('ReportsService', () => {
  let prisma: MockPrisma;
  let audit: ReturnType<typeof createAuditService>;
  let drive: ReturnType<typeof createDriveService>;
  let queue: ReturnType<typeof createReportsQueueService>;
  let service: ReportsService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = createAuditService();
    drive = createDriveService();
    queue = createReportsQueueService();
    prisma.reportExportJob.create.mockResolvedValue(QUEUED_JOB);
    prisma.reportExportJob.findUnique.mockResolvedValue(QUEUED_JOB);
    prisma.fileAsset.findUnique.mockResolvedValue({ id: 'file-1' });
    prisma.reportExportJob.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...QUEUED_JOB, ...data, fileAsset: null }),
    );
    const reportService = { getReport: vi.fn().mockResolvedValue({ reportId: 'company-pnl' }) };
    service = new ReportsService(
      prisma as never,
      audit as never,
      drive as never,
      reportService as never,
      reportService as never,
      reportService as never,
      reportService as never,
      reportService as never,
      reportService as never,
      queue as never,
    );
  });

  it('creates an audited queued export job for a registered report definition', async () => {
    await service.createExportJob(
      'employee-1',
      {
        ...FINANCE_PERMISSIONS,
      },
      {
        reportKey: 'company-pnl',
        ownerModule: 'FINANCE',
        format: 'CSV',
        filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
      },
    );

    expect(prisma.reportExportJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportKey: 'company-pnl',
          reportTitle: 'Company P&L',
          ownerModule: 'FINANCE',
          format: 'CSV',
          requestedById: 'employee-1',
        }),
      }),
    );
    expect(queue.enqueueExport).toHaveBeenCalledWith({ jobId: 'job-1', actorId: 'employee-1' });
    expect(drive.createGeneratedFileAsset).toHaveBeenCalledTimes(0);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'REPORT_EXPORT_JOB',
        action: 'report_export.requested',
        userId: 'employee-1',
        changes: expect.objectContaining({
          sensitive: true,
          confidentiality: 'FINANCE_SENSITIVE',
        }),
      }),
    );
  });

  it('processes a queued CSV export into a Drive file', async () => {
    await service.processExportJob('job-1', 'employee-1');

    expect(drive.createGeneratedFileAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceModule: 'REPORTS',
        confidentiality: 'FINANCE_SENSITIVE',
        storageKey: expect.stringContaining('Drive/_exports/reports/'),
        contentType: 'text/csv; charset=utf-8',
      }),
    );
    expect(prisma.reportExportJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', fileAssetId: 'file-1' }),
      }),
    );
  });

  it('processes a queued XLSX export into a Drive file', async () => {
    prisma.reportExportJob.findUnique.mockResolvedValueOnce({ ...QUEUED_JOB, format: 'XLSX' });

    await service.processExportJob('job-1', 'employee-1');

    expect(drive.createGeneratedFileAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        fileType: 'SPREADSHEET',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
  });

  it('processes a queued PDF export into a Drive file', async () => {
    prisma.reportExportJob.findUnique.mockResolvedValueOnce({ ...QUEUED_JOB, format: 'PDF' });

    await service.processExportJob('job-1', 'employee-1');

    expect(drive.createGeneratedFileAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        fileType: 'DOCUMENT',
        contentType: 'application/pdf',
      }),
    );
  });

  it('rejects mismatched report owner modules', async () => {
    await expect(
      service.createExportJob(
        'employee-1',
        {
          ...FINANCE_PERMISSIONS,
        },
        {
          reportKey: 'company-pnl',
          ownerModule: 'MARKETING',
          format: 'CSV',
        },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects unknown export formats', async () => {
    await expect(
      service.createExportJob(
        'employee-1',
        {
          ...CROSS_MODULE_PERMISSIONS,
        },
        {
          reportKey: 'marketing-source-performance',
          ownerModule: 'MARKETING',
          format: 'DOCX',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates an export job for a non-Finance report definition', async () => {
    await service.createExportJob(
      'employee-1',
      {
        ...CROSS_MODULE_PERMISSIONS,
      },
      {
        reportKey: 'marketing-source-performance',
        ownerModule: 'MARKETING',
        format: 'CSV',
      },
    );

    expect(prisma.reportExportJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportKey: 'marketing-source-performance',
          reportTitle: 'Marketing Source Performance',
          ownerModule: 'MARKETING',
        }),
      }),
    );
  });

  it('creates an audited scheduled report model without sending a fake report', async () => {
    await service.createSchedule(
      'employee-1',
      {
        ...FINANCE_PERMISSIONS,
      },
      {
        reportKey: 'company-pnl',
        ownerModule: 'FINANCE',
        format: 'CSV',
        recipientEmails: ['finance@example.com'],
        scheduleLabel: 'Monthly finance packet',
        frequency: 'MONTHLY',
        timeOfDay: '09:00',
        dayOfMonth: 5,
      },
    );

    expect(prisma.reportSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportKey: 'company-pnl',
          reportTitle: 'Company P&L',
          ownerModule: 'FINANCE',
          format: 'CSV',
          ownerId: 'employee-1',
          recipientEmails: ['finance@example.com'],
          scheduleLabel: 'Monthly finance packet',
          frequency: 'MONTHLY',
          timeOfDay: '09:00',
          dayOfMonth: 5,
        }),
      }),
    );
    expect(drive.createGeneratedFileAsset).toHaveBeenCalledTimes(0);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'REPORT_SCHEDULE',
        action: 'report_schedule.created',
        changes: expect.objectContaining({
          sensitive: true,
          confidentiality: 'FINANCE_SENSITIVE',
        }),
      }),
    );
  });

  it('creates a personal saved report view with validated filters', async () => {
    await service.createSavedView(
      'employee-1',
      {
        ...FINANCE_PERMISSIONS,
      },
      {
        reportKey: 'company-pnl',
        ownerModule: 'FINANCE',
        name: 'Current month P&L',
        filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
      },
    );

    expect(prisma.savedReportView.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportKey: 'company-pnl',
          reportTitle: 'Company P&L',
          ownerModule: 'FINANCE',
          name: 'Current month P&L',
          ownerId: 'employee-1',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'SAVED_REPORT_VIEW',
        action: 'report_saved_view.created',
      }),
    );
  });

  it('exposes data-quality warnings from module-owned report definitions', async () => {
    const result = await service.listDataQualityWarnings(FINANCE_PERMISSIONS);

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportKey: 'company-pnl',
          ownerModule: 'FINANCE',
          code: 'MODULE_OWNED_SOURCES',
        }),
        expect.objectContaining({
          reportKey: 'company-pnl',
          code: 'REPORT_NOTE',
          sourceKind: 'REGISTRY',
        }),
      ]),
    );
  });

  it('adds runtime marketing data-quality warnings for accessible cross-module reports', async () => {
    prisma.marketingAccount.findMany.mockResolvedValueOnce([{ financeExpensePlanId: null }]);
    prisma.marketingActivity.findMany.mockResolvedValueOnce([
      { budget: 100, expenseCardId: null, status: 'LAUNCHED' },
    ]);
    prisma.deal.findMany.mockResolvedValueOnce([]);

    const result = await service.listDataQualityWarnings(CROSS_MODULE_PERMISSIONS);

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportKey: 'marketing-source-performance',
          code: 'MISSING_ACCOUNT_FINANCE_LINKS',
          severity: 'WARNING',
          sourceKind: 'RUNTIME',
          details: expect.objectContaining({ count: 1 }),
        }),
        expect.objectContaining({
          reportKey: 'marketing-source-performance',
          code: 'MISSING_ACTIVITY_EXPENSE_LINKS',
          severity: 'WARNING',
          sourceKind: 'RUNTIME',
          details: expect.objectContaining({ count: 1 }),
        }),
      ]),
    );
  });

  it('does not complete an export job without a real Drive file asset', async () => {
    prisma.fileAsset.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.completeExportJobWithDriveFile('job-1', 'missing-file', 'employee-1'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.reportExportJob.update).not.toHaveBeenCalled();
  });

  it('rejects export creation when source permissions are missing', async () => {
    await expect(
      service.createExportJob(
        'employee-1',
        {},
        {
          reportKey: 'marketing-source-performance',
          ownerModule: 'MARKETING',
          format: 'CSV',
        },
      ),
    ).rejects.toThrow('source-module permissions');
  });

  it('retries a failed export job by creating a new queued job', async () => {
    prisma.reportExportJob.findUnique.mockResolvedValueOnce(FAILED_JOB);
    prisma.reportExportJob.create.mockResolvedValueOnce({ ...QUEUED_JOB, id: 'job-retry-1' });

    const retried = await service.retryExportJob('employee-1', FINANCE_PERMISSIONS, 'job-failed');

    expect(retried.id).toBe('job-retry-1');
    expect(prisma.reportExportJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reportKey: FAILED_JOB.reportKey,
          ownerModule: FAILED_JOB.ownerModule,
          format: FAILED_JOB.format,
          requestedById: 'employee-1',
        }),
      }),
    );
    expect(queue.enqueueExport).toHaveBeenCalledWith({
      jobId: 'job-retry-1',
      actorId: 'employee-1',
    });
  });

  it('cancels a queued export job', async () => {
    prisma.reportExportJob.findUnique.mockResolvedValueOnce(QUEUED_JOB);
    prisma.reportExportJob.update.mockResolvedValueOnce({ ...QUEUED_JOB, status: 'CANCELLED' });

    const cancelled = await service.cancelExportJob('employee-1', FINANCE_PERMISSIONS, 'job-1');

    expect(cancelled.status).toBe('CANCELLED');
    expect(prisma.reportExportJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
  });
});
