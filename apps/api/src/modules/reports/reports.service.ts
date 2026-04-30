import { createHash } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { DriveService } from '../drive/drive.service';
import { R2_DRIVE_PREFIX } from '../drive/drive-storage';
import { CashFlowService } from '../finance/reports/cash-flow.service';
import { CompanyPnlService } from '../finance/reports/company-pnl.service';
import { ExpensePlanVsActualService } from '../finance/reports/expense-plan-vs-actual.service';
import { FinanceReportsService } from '../finance/reports/reports.service';
import { MrrSubscriptionRevenueService } from '../finance/reports/mrr-subscription-revenue.service';
import { PayrollReportService } from '../finance/reports/payroll-report.service';
import { ProjectPnlService } from '../finance/reports/project-pnl.service';
import {
  buildSensitiveReportAuditContext,
  REPORT_FINANCE_CONFIDENTIALITY,
} from './reports-audit-context';
import { ReportsQueueService } from './reports-queue.service';
import { parseReportExportJobInput, parseReportScheduleInput } from './reports-validation';
import type {
  CreateReportExportJobDto,
  CreateReportScheduleDto,
  ReportDataQualityWarning,
} from './reports.types';

const REPORT_EXPORT_AUDIT_ENTITY = 'REPORT_EXPORT_JOB';
const REPORT_EXPORT_JOB_LIMIT = 25;
const REPORT_SCHEDULE_AUDIT_ENTITY = 'REPORT_SCHEDULE';
const REPORT_SCHEDULE_LIMIT = 50;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly financeReportsService: FinanceReportsService,
    private readonly auditService: AuditService,
    private readonly driveService: DriveService,
    private readonly companyPnlService: CompanyPnlService,
    private readonly cashFlowService: CashFlowService,
    private readonly expensePlanVsActualService: ExpensePlanVsActualService,
    private readonly mrrSubscriptionRevenueService: MrrSubscriptionRevenueService,
    private readonly payrollReportService: PayrollReportService,
    private readonly projectPnlService: ProjectPnlService,
    private readonly reportsQueueService?: ReportsQueueService,
  ) {}

  async listExportJobs(requestedById: string) {
    return this.prisma.reportExportJob.findMany({
      where: { requestedById },
      include: { fileAsset: true },
      orderBy: { queuedAt: 'desc' },
      take: REPORT_EXPORT_JOB_LIMIT,
    });
  }

  async listSchedules(ownerId: string) {
    return this.prisma.reportSchedule.findMany({
      where: { ownerId },
      orderBy: [{ status: 'asc' }, { nextRunAt: 'asc' }],
      take: REPORT_SCHEDULE_LIMIT,
    });
  }

  listDataQualityWarnings(): { items: ReportDataQualityWarning[]; meta: { count: number } } {
    const definitions = this.financeReportsService.getDefinitions().items;
    const items = definitions.flatMap((definition) => {
      const warnings: ReportDataQualityWarning[] = [
        {
          reportKey: definition.id,
          reportTitle: definition.title,
          ownerModule: 'FINANCE',
          severity: 'INFO',
          code: 'MODULE_OWNED_SOURCES',
          message: 'Finance owns this report formula; Reports exposes source endpoints only.',
          sourceEndpoints: definition.sourceEndpoints,
        },
      ];
      if (definition.phase6Deferred) {
        warnings.push({
          reportKey: definition.id,
          reportTitle: definition.title,
          ownerModule: 'FINANCE',
          severity: 'INFO',
          code: 'DEFERRED_DEPTH',
          message: definition.phase6Deferred,
          sourceEndpoints: definition.sourceEndpoints,
        });
      }
      if (!definition.aggregateEndpoint || definition.v1Status !== 'definition_ready') {
        warnings.push({
          reportKey: definition.id,
          reportTitle: definition.title,
          ownerModule: 'FINANCE',
          severity: 'WARNING',
          code: 'INCOMPLETE_PROJECTION',
          message:
            'This report is visible in the catalog but its aggregate projection is incomplete.',
          sourceEndpoints: definition.sourceEndpoints,
        });
      }
      return warnings;
    });
    return { items, meta: { count: items.length } };
  }

  async createExportJob(requestedById: string, input: CreateReportExportJobDto) {
    const parsed = parseReportExportJobInput(input);
    if (parsed.ownerModule !== 'FINANCE') {
      throw new BadRequestException('Only Finance-owned report exports are wired in this slice.');
    }

    const definition = this.financeReportsService.getDefinition(parsed.reportKey);
    const job = await this.prisma.reportExportJob.create({
      data: {
        reportKey: definition.id,
        reportTitle: definition.title,
        ownerModule: parsed.ownerModule,
        format: parsed.format,
        requestedById,
        filters: parsed.filters,
      },
      include: { fileAsset: true },
    });

    await this.auditService.log({
      entityType: REPORT_EXPORT_AUDIT_ENTITY,
      entityId: job.id,
      action: 'report_export.requested',
      userId: requestedById,
      changes: this.buildAuditChanges(job.reportKey, job.format, parsed.filters),
    });

    await this.reportsQueueService?.enqueueExport({ jobId: job.id, actorId: requestedById });
    return job;
  }

  async createSchedule(ownerId: string, input: CreateReportScheduleDto) {
    const parsed = parseReportScheduleInput(input);
    if (parsed.ownerModule !== 'FINANCE') {
      throw new BadRequestException('Only Finance-owned report schedules are wired in this slice.');
    }

    const definition = this.financeReportsService.getDefinition(parsed.reportKey);
    const schedule = await this.prisma.reportSchedule.create({
      data: {
        reportKey: definition.id,
        reportTitle: definition.title,
        ownerModule: parsed.ownerModule,
        format: parsed.format,
        ownerId,
        recipientEmails: parsed.recipientEmails,
        scheduleLabel: parsed.scheduleLabel,
        filters: parsed.filters,
        frequency: parsed.frequency,
        timezone: parsed.timezone,
        timeOfDay: parsed.timeOfDay,
        startDate: parsed.startDate,
        dayOfWeek: parsed.dayOfWeek,
        dayOfMonth: parsed.dayOfMonth,
        nextRunAt: parsed.nextRunAt,
      },
    });

    await this.auditService.log({
      entityType: REPORT_SCHEDULE_AUDIT_ENTITY,
      entityId: schedule.id,
      action: 'report_schedule.created',
      userId: ownerId,
      changes: {
        format: schedule.format,
        recipientCount: schedule.recipientEmails.length,
        scheduleLabel: schedule.scheduleLabel,
        frequency: schedule.frequency,
        timeOfDay: schedule.timeOfDay,
        timezone: schedule.timezone,
        nextRunAt: schedule.nextRunAt.toISOString(),
        ...buildSensitiveReportAuditContext(schedule.reportKey),
      },
    });

    return schedule;
  }

  async completeExportJobWithDriveFile(jobId: string, fileAssetId: string, actorId: string) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!file) throw new NotFoundException('Drive output file was not found.');

    const job = await this.prisma.reportExportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        fileAssetId,
        completedAt: new Date(),
        errorMessage: null,
      },
      include: { fileAsset: true },
    });

    await this.auditService.log({
      entityType: REPORT_EXPORT_AUDIT_ENTITY,
      entityId: job.id,
      action: 'report_export.completed',
      userId: actorId,
      changes: { fileAssetId, ...buildSensitiveReportAuditContext(job.reportKey) },
    });

    return job;
  }

  async processExportJob(jobId: string, actorId: string) {
    const job = await this.prisma.reportExportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Report export job not found.');
    if (job.format !== 'CSV') {
      return this.failExportJob(job.id, actorId, 'Only CSV export writing is implemented.');
    }

    await this.prisma.reportExportJob.update({
      where: { id: job.id },
      data: { status: 'PROCESSING', startedAt: new Date(), errorMessage: null },
    });

    try {
      const payload = await this.getFinanceReportPayload(job.reportKey, job.filters);
      const csv = toCsvRows(payload);
      const file = await this.driveService.createGeneratedFileAsset({
        displayName: buildExportFileName(job.reportKey, job.id),
        fileType: 'SPREADSHEET',
        purpose: 'OTHER',
        sourceModule: 'REPORTS',
        createdById: actorId,
        visibility: 'RESTRICTED',
        confidentiality: REPORT_FINANCE_CONFIDENTIALITY,
        storageKey: buildExportStorageKey(job.reportKey, job.id),
        content: csv,
        contentType: 'text/csv; charset=utf-8',
        checksum: createHash('sha256').update(csv).digest('hex'),
        link: { entityType: REPORT_EXPORT_AUDIT_ENTITY, entityId: job.id, linkType: 'OTHER' },
      });
      return this.completeExportJobWithDriveFile(job.id, file.id, actorId);
    } catch (caught) {
      return this.failExportJob(job.id, actorId, errorMessage(caught));
    }
  }

  private buildAuditChanges(
    reportKey: string,
    format: string,
    filters?: InputJsonValue,
  ): InputJsonValue {
    return {
      format,
      filters: filters ?? null,
      driveOutput: 'pending',
      ...buildSensitiveReportAuditContext(reportKey),
    };
  }

  private async failExportJob(jobId: string, actorId: string, message: string) {
    const job = await this.prisma.reportExportJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', failedAt: new Date(), errorMessage: message },
      include: { fileAsset: true },
    });
    await this.auditService.log({
      entityType: REPORT_EXPORT_AUDIT_ENTITY,
      entityId: job.id,
      action: 'report_export.failed',
      userId: actorId,
      changes: { errorMessage: message, ...buildSensitiveReportAuditContext(job.reportKey) },
    });
    return job;
  }

  private getFinanceReportPayload(reportKey: string, filters: InputJsonValue | null) {
    const query = parseReportFilters(filters);
    if (reportKey === 'company-pnl') return this.companyPnlService.getReport(query);
    if (reportKey === 'cash-flow') return this.cashFlowService.getReport(query);
    if (reportKey === 'expense-plan-vs-actual') {
      return this.expensePlanVsActualService.getReport(query);
    }
    if (reportKey === 'mrr-subscription-revenue') {
      return this.mrrSubscriptionRevenueService.getReport(query);
    }
    if (reportKey === 'payroll-report') return this.payrollReportService.getReport(query);
    if (reportKey === 'project-pnl') return this.projectPnlService.getReport(query);
    throw new NotFoundException('Finance report export source was not found.');
  }
}

function parseReportFilters(filters: InputJsonValue | null): {
  dateFrom?: string;
  dateTo?: string;
  asOf?: string;
} {
  if (!filters || Array.isArray(filters) || typeof filters !== 'object') return {};
  return {
    dateFrom: stringField(filters, 'dateFrom'),
    dateTo: stringField(filters, 'dateTo'),
    asOf: stringField(filters, 'asOf'),
  };
}

function stringField(source: object, key: string): string | undefined {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toCsvRows(payload: unknown): string {
  const rows = [['path', 'value'], ...flattenPayload(payload)];
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n') + '\n';
}

function flattenPayload(value: unknown, path = 'report'): string[][] {
  if (value === null || typeof value !== 'object') return [[path, scalarValue(value)]];
  if (Array.isArray(value)) return [[path, JSON.stringify(value)]];
  return Object.entries(value).flatMap(([key, item]) => flattenPayload(item, `${path}.${key}`));
}

function scalarValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function escapeCsvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildExportFileName(reportKey: string, jobId: string): string {
  return `${dateStamp()}__report-export__${sanitizeSegment(reportKey)}__${jobId}.csv`;
}

function buildExportStorageKey(reportKey: string, jobId: string): string {
  return `${R2_DRIVE_PREFIX}_exports/reports/${buildExportFileName(reportKey, jobId)}`;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeSegment(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'report'
  );
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'Report export failed.';
}
