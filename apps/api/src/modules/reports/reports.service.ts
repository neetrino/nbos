import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { DriveService } from '../drive/drive.service';
import { R2_DRIVE_PREFIX } from '../drive/drive-storage';
import { CashFlowService } from '../finance/reports/cash-flow.service';
import { CompanyPnlService } from '../finance/reports/company-pnl.service';
import { ExpensePlanVsActualService } from '../finance/reports/expense-plan-vs-actual.service';
import { MrrSubscriptionRevenueService } from '../finance/reports/mrr-subscription-revenue.service';
import { PayrollReportService } from '../finance/reports/payroll-report.service';
import { ProjectPnlService } from '../finance/reports/project-pnl.service';
import {
  buildSensitiveReportAuditContext,
  REPORT_FINANCE_CONFIDENTIALITY,
} from './reports-audit-context';
import { renderReportExportFile } from './reports-export-content';
import { buildRuntimeDataQualityWarnings } from './reports-data-quality-runtime';
import { hasReportSourceAccess } from './reports-permissions';
import { findReportDefinition, getReportDefinitions } from './report-definition-registry';
import { ReportsQueueService } from './reports-queue.service';
import {
  parseReportExportJobInput,
  parseReportScheduleInput,
  parseSavedReportViewInput,
} from './reports-validation';
import type {
  CreateReportExportJobDto,
  CreateReportScheduleDto,
  CreateSavedReportViewDto,
  ReportDataQualityWarning,
} from './reports.types';

const REPORT_EXPORT_AUDIT_ENTITY = 'REPORT_EXPORT_JOB';
const REPORT_EXPORT_JOB_LIMIT = 25;
const REPORT_SCHEDULE_AUDIT_ENTITY = 'REPORT_SCHEDULE';
const REPORT_SCHEDULE_LIMIT = 50;
const SAVED_REPORT_VIEW_AUDIT_ENTITY = 'SAVED_REPORT_VIEW';
const SAVED_REPORT_VIEW_LIMIT = 50;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
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

  listDefinitions(userPermissions: Record<string, string>) {
    const items = getReportDefinitions().filter((definition) =>
      hasReportSourceAccess(definition, userPermissions),
    );
    return {
      items,
      meta: {
        count: items.length,
        scope: 'Phase 7 Reports / Analytics report center definitions',
      },
    };
  }

  async listExportJobs(requestedById: string, userPermissions: Record<string, string>) {
    const jobs = await this.prisma.reportExportJob.findMany({
      where: { requestedById },
      include: { fileAsset: true },
      orderBy: { queuedAt: 'desc' },
      take: REPORT_EXPORT_JOB_LIMIT,
    });
    return jobs.filter((job) => {
      const definition = findReportDefinition(job.reportKey, job.ownerModule);
      return definition ? hasReportSourceAccess(definition, userPermissions) : false;
    });
  }

  async listSchedules(ownerId: string, userPermissions: Record<string, string>) {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: { ownerId },
      orderBy: [{ status: 'asc' }, { nextRunAt: 'asc' }],
      take: REPORT_SCHEDULE_LIMIT,
    });
    return schedules.filter((schedule) => {
      const definition = findReportDefinition(schedule.reportKey, schedule.ownerModule);
      return definition ? hasReportSourceAccess(definition, userPermissions) : false;
    });
  }

  async listSavedViews(ownerId: string, userPermissions: Record<string, string>) {
    const savedViews = await this.prisma.savedReportView.findMany({
      where: { ownerId },
      orderBy: [{ reportTitle: 'asc' }, { name: 'asc' }],
      take: SAVED_REPORT_VIEW_LIMIT,
    });
    return savedViews.filter((view) => {
      const definition = findReportDefinition(view.reportKey, view.ownerModule);
      return definition ? hasReportSourceAccess(definition, userPermissions) : false;
    });
  }

  async listDataQualityWarnings(userPermissions: Record<string, string>): Promise<{
    items: ReportDataQualityWarning[];
    meta: { count: number };
  }> {
    const definitions = getReportDefinitions().filter((definition) =>
      hasReportSourceAccess(definition, userPermissions),
    );
    const warningsByDefinition = await Promise.all(
      definitions.map(async (definition) => {
        const warnings: ReportDataQualityWarning[] = [
          {
            reportKey: definition.key,
            reportTitle: definition.title,
            ownerModule: definition.ownerModule,
            severity: 'INFO',
            code: 'MODULE_OWNED_SOURCES',
            message: `${definition.ownerModule} owns this report projection; Reports exposes discovery, exports and schedules.`,
            sourceEndpoints: definition.sourceEndpoints,
            sourceKind: 'REGISTRY',
          },
        ];
        for (const note of definition.dataQualityNotes) {
          warnings.push({
            reportKey: definition.key,
            reportTitle: definition.title,
            ownerModule: definition.ownerModule,
            severity: 'INFO',
            code: 'REPORT_NOTE',
            message: note,
            sourceEndpoints: definition.sourceEndpoints,
            sourceKind: 'REGISTRY',
          });
        }
        if (definition.status !== 'READY') {
          warnings.push({
            reportKey: definition.key,
            reportTitle: definition.title,
            ownerModule: definition.ownerModule,
            severity: 'WARNING',
            code: 'INCOMPLETE_PROJECTION',
            message: 'This report is visible in the catalog but its live projection is incomplete.',
            sourceEndpoints: definition.sourceEndpoints,
            sourceKind: 'REGISTRY',
          });
        }
        const runtimeWarnings = await buildRuntimeDataQualityWarnings(this.prisma, definition);
        warnings.push(...runtimeWarnings);
        return warnings;
      }),
    );
    const items = warningsByDefinition.flat();
    return { items, meta: { count: items.length } };
  }

  async createExportJob(
    requestedById: string,
    userPermissions: Record<string, string>,
    input: CreateReportExportJobDto,
  ) {
    const parsed = parseReportExportJobInput(input);
    const definition = this.getAccessibleDefinition(
      parsed.reportKey,
      parsed.ownerModule,
      userPermissions,
    );
    this.assertExportFormatSupported(definition.supportedExports, parsed.format);
    const job = await this.prisma.reportExportJob.create({
      data: {
        reportKey: definition.key,
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

  async retryExportJob(
    requestedById: string,
    userPermissions: Record<string, string>,
    jobId: string,
  ) {
    const sourceJob = await this.getOwnedExportJob(jobId, requestedById);
    if (sourceJob.status !== 'FAILED' && sourceJob.status !== 'CANCELLED') {
      throw new BadRequestException('Only failed or cancelled export jobs can be retried.');
    }
    const definition = this.getAccessibleDefinition(
      sourceJob.reportKey,
      sourceJob.ownerModule,
      userPermissions,
    );
    this.assertExportFormatSupported(definition.supportedExports, sourceJob.format);
    const retriedJob = await this.prisma.reportExportJob.create({
      data: {
        reportKey: sourceJob.reportKey,
        reportTitle: sourceJob.reportTitle,
        ownerModule: sourceJob.ownerModule,
        format: sourceJob.format,
        requestedById,
        filters: sourceJob.filters === null ? undefined : (sourceJob.filters as InputJsonValue),
      },
      include: { fileAsset: true },
    });
    await this.auditService.log({
      entityType: REPORT_EXPORT_AUDIT_ENTITY,
      entityId: retriedJob.id,
      action: 'report_export.retried',
      userId: requestedById,
      changes: {
        sourceJobId: sourceJob.id,
        format: retriedJob.format,
        filters: retriedJob.filters ?? null,
        driveOutput: 'pending',
        ...buildSensitiveReportAuditContext(retriedJob.reportKey),
      },
    });
    await this.reportsQueueService?.enqueueExport({ jobId: retriedJob.id, actorId: requestedById });
    return retriedJob;
  }

  async cancelExportJob(
    requestedById: string,
    userPermissions: Record<string, string>,
    jobId: string,
  ) {
    const job = await this.getOwnedExportJob(jobId, requestedById);
    this.getAccessibleDefinition(job.reportKey, job.ownerModule, userPermissions);
    if (job.status === 'CANCELLED') return job;
    if (job.status === 'COMPLETED') {
      throw new BadRequestException('Completed export jobs cannot be cancelled.');
    }
    if (job.status === 'FAILED') {
      throw new BadRequestException('Failed export jobs cannot be cancelled.');
    }
    const cancelled = await this.prisma.reportExportJob.update({
      where: { id: job.id },
      data: {
        status: 'CANCELLED',
        errorMessage: null,
      },
      include: { fileAsset: true },
    });
    await this.auditService.log({
      entityType: REPORT_EXPORT_AUDIT_ENTITY,
      entityId: cancelled.id,
      action: 'report_export.cancelled',
      userId: requestedById,
      changes: { ...buildSensitiveReportAuditContext(cancelled.reportKey) },
    });
    return cancelled;
  }

  async createSchedule(
    ownerId: string,
    userPermissions: Record<string, string>,
    input: CreateReportScheduleDto,
  ) {
    const parsed = parseReportScheduleInput(input);
    const definition = this.getAccessibleDefinition(
      parsed.reportKey,
      parsed.ownerModule,
      userPermissions,
    );
    this.assertExportFormatSupported(definition.supportedExports, parsed.format);
    const schedule = await this.prisma.reportSchedule.create({
      data: {
        reportKey: definition.key,
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

  async createSavedView(
    ownerId: string,
    userPermissions: Record<string, string>,
    input: CreateSavedReportViewDto,
  ) {
    const parsed = parseSavedReportViewInput(input);
    const definition = this.getAccessibleDefinition(
      parsed.reportKey,
      parsed.ownerModule,
      userPermissions,
    );
    const view = await this.prisma.savedReportView.create({
      data: {
        reportKey: definition.key,
        reportTitle: definition.title,
        ownerModule: parsed.ownerModule,
        name: parsed.name,
        filters: parsed.filters,
        ownerId,
      },
    });
    await this.auditService.log({
      entityType: SAVED_REPORT_VIEW_AUDIT_ENTITY,
      entityId: view.id,
      action: 'report_saved_view.created',
      userId: ownerId,
      changes: {
        name: view.name,
        filters: view.filters ?? null,
        ...buildSensitiveReportAuditContext(view.reportKey),
      },
    });
    return view;
  }

  async completeExportJobWithDriveFile(jobId: string, fileAssetId: string, actorId: string) {
    const file = await this.prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
    if (!file) throw new NotFoundException('Drive output file was not found.');
    const current = await this.prisma.reportExportJob.findUnique({
      where: { id: jobId },
      include: { fileAsset: true },
    });
    if (!current) throw new NotFoundException('Report export job not found.');
    if (current.status === 'CANCELLED') return current;

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
    const job = await this.prisma.reportExportJob.findUnique({
      where: { id: jobId },
      include: { fileAsset: true },
    });
    if (!job) throw new NotFoundException('Report export job not found.');
    if (job.status === 'CANCELLED') return job;

    await this.prisma.reportExportJob.update({
      where: { id: job.id },
      data: { status: 'PROCESSING', startedAt: new Date(), errorMessage: null },
    });

    try {
      const payload = await this.getReportPayload(job.reportKey, job.ownerModule, job.filters);
      const exportFile = await renderReportExportFile(job.format, payload);
      const driveFile = await this.driveService.createGeneratedFileAsset({
        displayName: buildExportFileName(job.reportKey, job.id, exportFile.extension),
        fileType: exportFile.fileType,
        purpose: 'OTHER',
        sourceModule: 'REPORTS',
        createdById: actorId,
        visibility: 'RESTRICTED',
        confidentiality: REPORT_FINANCE_CONFIDENTIALITY,
        storageKey: buildExportStorageKey(job.reportKey, job.id, exportFile.extension),
        content: exportFile.content,
        contentType: exportFile.contentType,
        checksum: createHash('sha256').update(exportFile.content).digest('hex'),
        link: { entityType: REPORT_EXPORT_AUDIT_ENTITY, entityId: job.id, linkType: 'OTHER' },
      });
      return this.completeExportJobWithDriveFile(job.id, driveFile.id, actorId);
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

  private getRegisteredDefinition(reportKey: string, ownerModule: string) {
    const definition = findReportDefinition(reportKey, ownerModule);
    if (!definition) throw new NotFoundException('Report definition was not found.');
    return definition;
  }

  private async getOwnedExportJob(jobId: string, requestedById: string) {
    const job = await this.prisma.reportExportJob.findUnique({
      where: { id: jobId },
      include: { fileAsset: true },
    });
    if (!job || job.requestedById !== requestedById) {
      throw new NotFoundException('Report export job was not found.');
    }
    return job;
  }

  private getAccessibleDefinition(
    reportKey: string,
    ownerModule: string,
    userPermissions: Record<string, string>,
  ) {
    const definition = this.getRegisteredDefinition(reportKey, ownerModule);
    if (!hasReportSourceAccess(definition, userPermissions)) {
      throw new ForbiddenException(
        'You do not have source-module permissions for this report definition.',
      );
    }
    return definition;
  }

  private assertExportFormatSupported(supportedFormats: readonly string[], format: string) {
    if (!supportedFormats.includes(format)) {
      throw new BadRequestException(`Report does not support ${format} export.`);
    }
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

  private getReportPayload(reportKey: string, ownerModule: string, filters: InputJsonValue | null) {
    if (ownerModule !== 'FINANCE')
      return this.getRegistryReportPayload(reportKey, ownerModule, filters);
    return this.getFinanceReportPayload(reportKey, filters);
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

  private getRegistryReportPayload(
    reportKey: string,
    ownerModule: string,
    filters: InputJsonValue | null,
  ) {
    const definition = this.getRegisteredDefinition(reportKey, ownerModule);
    return {
      reportKey: definition.key,
      reportTitle: definition.title,
      ownerModule: definition.ownerModule,
      generatedAt: new Date().toISOString(),
      filters: filters ?? null,
      sourceEndpoints: definition.sourceEndpoints,
      dataQualityNotes: definition.dataQualityNotes,
      message:
        'This export contains the registered report definition and source metadata. Live aggregate rows are owned by the source module projection.',
    };
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

function buildExportFileName(reportKey: string, jobId: string, extension: string): string {
  return `${dateStamp()}__report-export__${sanitizeSegment(reportKey)}__${jobId}.${extension}`;
}

function buildExportStorageKey(reportKey: string, jobId: string, extension: string): string {
  return `${R2_DRIVE_PREFIX}_exports/reports/${buildExportFileName(reportKey, jobId, extension)}`;
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
