import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { FinanceReportsService } from '../finance/reports/reports.service';
import { parseReportExportJobInput } from './reports-validation';
import type { CreateReportExportJobDto } from './reports.types';

const REPORT_EXPORT_AUDIT_ENTITY = 'REPORT_EXPORT_JOB';
const REPORT_EXPORT_JOB_LIMIT = 25;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly financeReportsService: FinanceReportsService,
    private readonly auditService: AuditService,
  ) {}

  async listExportJobs(requestedById: string) {
    return this.prisma.reportExportJob.findMany({
      where: { requestedById },
      include: { fileAsset: true },
      orderBy: { queuedAt: 'desc' },
      take: REPORT_EXPORT_JOB_LIMIT,
    });
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

    return job;
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
      changes: { fileAssetId },
    });

    return job;
  }

  private buildAuditChanges(
    reportKey: string,
    format: string,
    filters?: InputJsonValue,
  ): InputJsonValue {
    return {
      reportKey,
      format,
      filters: filters ?? null,
      driveOutput: 'pending',
    };
  }
}
