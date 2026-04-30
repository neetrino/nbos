import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { buildSensitiveReportAuditContext } from './reports-audit-context';
import { ReportsQueueService } from './reports-queue.service';
import { calculateNextReportScheduleRun } from './reports-schedule-recurrence';

const REPORT_SCHEDULE_AUDIT_ENTITY = 'REPORT_SCHEDULE';
const REPORT_SCHEDULE_DUE_LIMIT = 25;

type DueReportSchedule = Awaited<
  ReturnType<InstanceType<typeof PrismaClient>['reportSchedule']['findMany']>
>[number];

@Injectable()
export class ReportsScheduleRunnerService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
    private readonly reportsQueueService?: ReportsQueueService,
  ) {}

  async runDueSchedules(now = new Date()): Promise<{ processed: number; failed: number }> {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: { status: 'ACTIVE', nextRunAt: { lte: now } },
      orderBy: { nextRunAt: 'asc' },
      take: REPORT_SCHEDULE_DUE_LIMIT,
    });
    let processed = 0;
    let failed = 0;
    for (const schedule of schedules) {
      try {
        await this.runDueSchedule(schedule, now);
        processed += 1;
      } catch (caught) {
        failed += 1;
        await this.markScheduleFailed(schedule.id, errorMessage(caught), now);
      }
    }
    return { processed, failed };
  }

  private async runDueSchedule(schedule: DueReportSchedule, now: Date): Promise<void> {
    const exportJob = await this.prisma.reportExportJob.create({
      data: {
        reportKey: schedule.reportKey,
        reportTitle: schedule.reportTitle,
        ownerModule: schedule.ownerModule,
        format: schedule.format,
        requestedById: schedule.ownerId,
        filters: schedule.filters === null ? undefined : (schedule.filters as InputJsonValue),
      },
      include: { fileAsset: true },
    });
    await this.reportsQueueService?.enqueueExport({
      jobId: exportJob.id,
      actorId: schedule.ownerId,
    });
    await this.advanceSchedule(schedule, exportJob.id, now);
  }

  private async advanceSchedule(
    schedule: DueReportSchedule,
    exportJobId: string,
    now: Date,
  ): Promise<void> {
    const nextRunAt = calculateNextReportScheduleRun(
      {
        frequency: schedule.frequency,
        timezone: schedule.timezone,
        timeOfDay: schedule.timeOfDay,
        startDate: schedule.startDate,
        dayOfWeek: schedule.dayOfWeek ?? undefined,
        dayOfMonth: schedule.dayOfMonth ?? undefined,
      },
      now,
    );
    await this.prisma.reportSchedule.update({
      where: { id: schedule.id },
      data: { lastRunAt: now, lastExportJobId: exportJobId, nextRunAt, failureReason: null },
    });
    await this.auditService.log({
      entityType: REPORT_SCHEDULE_AUDIT_ENTITY,
      entityId: schedule.id,
      action: 'report_schedule.export_queued',
      userId: schedule.ownerId,
      changes: {
        exportJobId,
        nextRunAt: nextRunAt.toISOString(),
        ...buildSensitiveReportAuditContext(schedule.reportKey),
      },
    });
  }

  private async markScheduleFailed(scheduleId: string, message: string, now: Date): Promise<void> {
    await this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: { status: 'FAILED', lastFailureAt: now, failureReason: message },
    });
  }
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : 'Report schedule run failed.';
}
