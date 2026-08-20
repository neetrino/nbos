import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CreateManyNotificationCommand } from '../notifications/notification-command.service';
import { NotificationService } from '../notifications/notification.service';
import {
  isBullmqJobFinallyFailed,
  resolveBullmqMaxAttempts,
  type BullmqFailureJobLike,
} from './ops-job-failure-alert.bullmq';
import {
  OPS_ALERT_CATEGORY,
  OPS_ALERT_ENTITY_BULLMQ_QUEUE,
  OPS_ALERT_ENTITY_SCHEDULER_JOB,
  OPS_ALERT_EVENT_BULLMQ_JOB_FAILED,
  OPS_ALERT_EVENT_SCHEDULER_RUN_FAILED,
  OPS_ALERT_PRIORITY,
  OPS_ALERT_SOURCE_MODULE,
} from './ops-job-failure-alert.constants';
import {
  buildBullmqFailureCopy,
  buildSchedulerFailureCopy,
  opsAlertHourBucket,
} from './ops-job-failure-alert.copy';
import { resolveOpsAlertRecipientIds } from './ops-job-failure-alert.recipients';

export type SchedulerRunFailureAlertInput = {
  jobName: string;
  runId: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
};

@Injectable()
export class OpsJobFailureAlertService {
  private readonly logger = new Logger(OpsJobFailureAlertService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
  ) {}

  async notifySchedulerRunFailed(input: SchedulerRunFailureAlertInput): Promise<void> {
    const copy = buildSchedulerFailureCopy(input);
    await this.publishSafe({
      type: OPS_ALERT_EVENT_SCHEDULER_RUN_FAILED,
      title: copy.title,
      body: copy.body,
      link: copy.link,
      actionLabel: copy.actionLabel,
      category: OPS_ALERT_CATEGORY,
      priority: OPS_ALERT_PRIORITY,
      entityType: OPS_ALERT_ENTITY_SCHEDULER_JOB,
      entityId: input.jobName,
      sourceModule: OPS_ALERT_SOURCE_MODULE,
      dedupeKeyPrefix: `${OPS_ALERT_EVENT_SCHEDULER_RUN_FAILED}:${input.jobName}`,
      dedupeKeySuffix: opsAlertHourBucket(),
      payload: { runId: input.runId, status: input.status, errorCode: input.errorCode ?? null },
    });
  }

  async notifyIfBullmqFinallyFailed(
    queue: string,
    job: BullmqFailureJobLike | undefined,
    error: unknown,
  ): Promise<void> {
    if (!job || !isBullmqJobFinallyFailed(job)) return;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const copy = buildBullmqFailureCopy({
      queue,
      jobName: job.name,
      attempts: resolveBullmqMaxAttempts(job),
      errorMessage,
    });
    await this.publishSafe({
      type: OPS_ALERT_EVENT_BULLMQ_JOB_FAILED,
      title: copy.title,
      body: copy.body,
      link: copy.link,
      actionLabel: copy.actionLabel,
      category: OPS_ALERT_CATEGORY,
      priority: OPS_ALERT_PRIORITY,
      entityType: OPS_ALERT_ENTITY_BULLMQ_QUEUE,
      entityId: `${queue}:${job.name}`,
      sourceModule: OPS_ALERT_SOURCE_MODULE,
      dedupeKeyPrefix: `${OPS_ALERT_EVENT_BULLMQ_JOB_FAILED}:${queue}:${job.name}`,
      dedupeKeySuffix: opsAlertHourBucket(),
      payload: { queue, jobId: job.id ?? null, attempts: resolveBullmqMaxAttempts(job) },
    });
  }

  private async publishSafe(
    command: Omit<CreateManyNotificationCommand, 'recipientIds'>,
  ): Promise<void> {
    try {
      const recipientIds = await resolveOpsAlertRecipientIds(this.prisma);
      if (recipientIds.length === 0) {
        this.logger.warn(`No Founder/CEO recipients for ops alert type=${command.type}`);
        return;
      }
      await this.notifications.createMany({ ...command, recipientIds });
    } catch (caught) {
      this.logger.error(`Ops failure alert failed type=${command.type}`, caught);
    }
  }
}
