import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { buildSensitiveReportAuditContext } from './reports-audit-context';
import { calculateNextReportScheduleRun } from './reports-schedule-recurrence';

const REPORT_SCHEDULE_AUDIT_ENTITY = 'REPORT_SCHEDULE';

type ReportScheduleRecord = NonNullable<
  Awaited<ReturnType<InstanceType<typeof PrismaClient>['reportSchedule']['findFirst']>>
>;

@Injectable()
export class ReportsScheduleManagementService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async pauseSchedule(ownerId: string, scheduleId: string) {
    const schedule = await this.findOwnedSchedule(ownerId, scheduleId);
    this.assertNotArchived(schedule.status);
    const updated = await this.prisma.reportSchedule.update({
      where: { id: schedule.id },
      data: { status: 'PAUSED' },
    });
    await this.logScheduleAction(ownerId, schedule, 'report_schedule.paused');
    return updated;
  }

  async resumeSchedule(ownerId: string, scheduleId: string, now = new Date()) {
    const schedule = await this.findOwnedSchedule(ownerId, scheduleId);
    this.assertNotArchived(schedule.status);
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
    const updated = await this.prisma.reportSchedule.update({
      where: { id: schedule.id },
      data: { status: 'ACTIVE', nextRunAt, lastFailureAt: null, failureReason: null },
    });
    await this.logScheduleAction(ownerId, schedule, 'report_schedule.resumed', {
      nextRunAt: nextRunAt.toISOString(),
    });
    return updated;
  }

  async archiveSchedule(ownerId: string, scheduleId: string) {
    const schedule = await this.findOwnedSchedule(ownerId, scheduleId);
    const updated = await this.prisma.reportSchedule.update({
      where: { id: schedule.id },
      data: { status: 'ARCHIVED' },
    });
    await this.logScheduleAction(ownerId, schedule, 'report_schedule.archived');
    return updated;
  }

  private async findOwnedSchedule(
    ownerId: string,
    scheduleId: string,
  ): Promise<ReportScheduleRecord> {
    const schedule = await this.prisma.reportSchedule.findFirst({
      where: { id: scheduleId, ownerId },
    });
    if (!schedule) throw new NotFoundException('Report schedule was not found.');
    return schedule;
  }

  private assertNotArchived(status: string): void {
    if (status === 'ARCHIVED') {
      throw new BadRequestException('Archived report schedules cannot be changed.');
    }
  }

  private async logScheduleAction(
    userId: string,
    schedule: ReportScheduleRecord,
    action: string,
    changes: Record<string, string> = {},
  ): Promise<void> {
    await this.auditService.log({
      entityType: REPORT_SCHEDULE_AUDIT_ENTITY,
      entityId: schedule.id,
      action,
      userId,
      changes: { ...changes, ...buildSensitiveReportAuditContext(schedule.reportKey) },
    });
  }
}
