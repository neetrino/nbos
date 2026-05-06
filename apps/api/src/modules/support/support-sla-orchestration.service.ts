import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationService } from '../notifications/notification.service';
import { SUPPORT_SLA_RESOLVE_WARNING_RATIO, effectiveDeadlineTimestamps } from './support-sla';
import { resolveSupportSlaNotificationRecipientIds } from './support-sla-recipients';

export const SUPPORT_SLA_ORCHESTRATION_EVENT_TYPES = {
  RESOLVE_WARNING: 'support.sla.resolve_warning',
  RESPONSE_BREACHED: 'support.sla.response_breached',
  RESOLVE_BREACHED: 'support.sla.resolve_breached',
} as const;

const SOURCE_MODULE = 'support';

interface OrchestrationTicket {
  id: string;
  code: string;
  title: string;
  status: string;
  waitingState: string;
  assignedTo: string | null;
  createdAt: Date;
  slaResponseDeadline: Date | null;
  slaResolveDeadline: Date | null;
  slaPausedTotalSeconds: number;
  slaPauseStartedAt: Date | null;
  project: { name: string };
}

@Injectable()
export class SupportSlaOrchestrationService {
  private readonly logger = new Logger(SupportSlaOrchestrationService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notificationService: NotificationService,
  ) {}

  /** Scheduler entry: idempotent in-app signals for SLA risk / breach (waiting overlay skips clock). */
  async runSlaEscalationScan(asOf: Date = new Date()) {
    const rows = await this.prisma.supportTicket.findMany({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        waitingState: true,
        assignedTo: true,
        createdAt: true,
        slaResponseDeadline: true,
        slaResolveDeadline: true,
        slaPausedTotalSeconds: true,
        slaPauseStartedAt: true,
        project: { select: { name: true } },
      },
    });

    let warnings = 0;
    let responseBreaches = 0;
    let resolveBreaches = 0;

    for (const row of rows) {
      const ticket = row as OrchestrationTicket;
      if (ticket.waitingState !== 'NONE') continue;

      const nowMs = asOf.getTime();
      const t = {
        status: ticket.status,
        createdAt: ticket.createdAt,
        waitingState: ticket.waitingState,
        slaResponseDeadline: ticket.slaResponseDeadline,
        slaResolveDeadline: ticket.slaResolveDeadline,
        slaPausedTotalSeconds: ticket.slaPausedTotalSeconds,
        slaPauseStartedAt: ticket.slaPauseStartedAt,
      };

      const { effResponse, effResolve } = effectiveDeadlineTimestamps(
        {
          status: t.status,
          createdAt: t.createdAt,
          waitingState: t.waitingState,
          slaResponseDeadline: t.slaResponseDeadline,
          slaResolveDeadline: t.slaResolveDeadline,
          slaPausedTotalSeconds: t.slaPausedTotalSeconds,
          slaPauseStartedAt: t.slaPauseStartedAt,
        },
        nowMs,
      );

      const created = ticket.createdAt.getTime();
      const responseBreached = effResponse !== null && nowMs > effResponse;
      const resolveBreached = effResolve !== null && nowMs > effResolve;

      const recipients = await resolveSupportSlaNotificationRecipientIds(
        this.prisma,
        ticket.assignedTo,
      );
      if (recipients.length === 0) continue;

      if (resolveBreached) {
        const sent = await this.notifyAll(
          recipients,
          SUPPORT_SLA_ORCHESTRATION_EVENT_TYPES.RESOLVE_BREACHED,
          `support-sla:resolve-breached:${ticket.id}`,
          ticket.id,
          this.buildPayload(ticket, 'Resolution SLA breached', asOf),
        );
        if (sent) resolveBreaches += 1;
        continue;
      }

      if (responseBreached) {
        const sent = await this.notifyAll(
          recipients,
          SUPPORT_SLA_ORCHESTRATION_EVENT_TYPES.RESPONSE_BREACHED,
          `support-sla:response-breached:${ticket.id}`,
          ticket.id,
          this.buildPayload(ticket, 'First response SLA breached', asOf),
        );
        if (sent) responseBreaches += 1;
        continue;
      }

      if (effResolve !== null) {
        const total = effResolve - created;
        const remaining = effResolve - nowMs;
        if (total > 0 && remaining / total <= SUPPORT_SLA_RESOLVE_WARNING_RATIO) {
          const sent = await this.notifyAll(
            recipients,
            SUPPORT_SLA_ORCHESTRATION_EVENT_TYPES.RESOLVE_WARNING,
            `support-sla:resolve-warning:${ticket.id}`,
            ticket.id,
            this.buildPayload(ticket, 'Approaching resolution SLA threshold', asOf),
          );
          if (sent) warnings += 1;
        }
      }
    }

    this.logger.log(
      `Support SLA scan: tickets=${rows.length}, warnings=${warnings}, responseBreaches=${responseBreaches}, resolveBreaches=${resolveBreaches}`,
    );

    return {
      asOf: asOf.toISOString(),
      scanned: rows.length,
      warnings,
      responseBreaches,
      resolveBreaches,
    };
  }

  private buildPayload(ticket: OrchestrationTicket, headline: string, asOf: Date): InputJsonValue {
    return {
      headline,
      ticketCode: ticket.code,
      ticketTitle: ticket.title,
      projectName: ticket.project.name,
      asOf: asOf.toISOString(),
    };
  }

  private async notifyAll(
    recipientIds: string[],
    type: string,
    dedupeKey: string,
    ticketId: string,
    payload: InputJsonValue,
  ): Promise<boolean> {
    let anySent = false;
    for (const recipientId of recipientIds) {
      try {
        await this.notificationService.create({
          type,
          recipientId,
          title: 'Support SLA',
          body: String((payload as { headline?: string }).headline ?? type),
          link: '/support',
          entityType: 'SupportTicket',
          entityId: ticketId,
          sourceModule: SOURCE_MODULE,
          dedupeKey: `${dedupeKey}:${recipientId}`,
          idempotencyKey: `${dedupeKey}:${recipientId}`,
          payload,
        });
        anySent = true;
      } catch (err) {
        this.logger.warn(`Support SLA notify failed for ${recipientId}: ${String(err)}`);
      }
    }
    return anySent;
  }
}
