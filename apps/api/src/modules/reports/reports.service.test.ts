import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { DriveService } from '../drive/drive.service';
import type { FinanceReportDefinition } from '../finance/reports/finance-report-definitions';
import { FinanceReportsService } from '../finance/reports/reports.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { ReportsQueueService } from './reports-queue.service';
import { ReportsService } from './reports.service';

function createFinanceReportsService(): Partial<FinanceReportsService> {
  const definition: FinanceReportDefinition = {
    id: 'company-pnl',
    title: 'Company P&L',
    audience: ['CEO'],
    description: 'Finance-owned report.',
    v1Status: 'definition_ready',
    sourceEndpoints: [],
    drillDownHrefs: [],
    phase3Scope: 'Finance owns formulas.',
    phase6Deferred: 'Reports owns export jobs.',
  };
  return {
    getDefinition: vi.fn(() => definition),
    getDefinitions: vi.fn(() => ({
      items: [definition],
      meta: { count: 1, scope: 'test', phase6Boundary: 'test' },
    })),
  };
}

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

describe('ReportsService', () => {
  let prisma: MockPrisma;
  let financeReports: ReturnType<typeof createFinanceReportsService>;
  let audit: ReturnType<typeof createAuditService>;
  let drive: ReturnType<typeof createDriveService>;
  let queue: ReturnType<typeof createReportsQueueService>;
  let service: ReportsService;

  beforeEach(() => {
    prisma = createMockPrisma();
    financeReports = createFinanceReportsService();
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
      financeReports as never,
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

  it('creates an audited queued export job for a Finance-owned report definition', async () => {
    await service.createExportJob('employee-1', {
      reportKey: 'company-pnl',
      ownerModule: 'FINANCE',
      format: 'CSV',
      filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
    });

    expect(financeReports.getDefinition).toHaveBeenCalledWith('company-pnl');
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

  it('rejects unsupported report owner modules', async () => {
    await expect(
      service.createExportJob('employee-1', {
        reportKey: 'company-pnl',
        ownerModule: 'MARKETING',
        format: 'CSV',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates an audited scheduled report model without sending a fake report', async () => {
    await service.createSchedule('employee-1', {
      reportKey: 'company-pnl',
      ownerModule: 'FINANCE',
      format: 'CSV',
      recipientEmails: ['finance@example.com'],
      scheduleLabel: 'Monthly finance packet',
      frequency: 'MONTHLY',
      timeOfDay: '09:00',
      dayOfMonth: 5,
    });

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
    await service.createSavedView('employee-1', {
      reportKey: 'company-pnl',
      ownerModule: 'FINANCE',
      name: 'Current month P&L',
      filters: { dateFrom: '2026-04-01', dateTo: '2026-04-30' },
    });

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

  it('exposes data-quality warnings from module-owned report definitions', () => {
    const result = service.listDataQualityWarnings();

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportKey: 'company-pnl',
          ownerModule: 'FINANCE',
          code: 'MODULE_OWNED_SOURCES',
        }),
        expect.objectContaining({
          reportKey: 'company-pnl',
          code: 'DEFERRED_DEPTH',
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
});
