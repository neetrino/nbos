import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationRealtimePublisher } from '../realtime/notification-realtime.publisher';
import { isNotificationInboxStateWriteEnabled } from './notification-inbox-state.flags';
import {
  incrementInboxUnread,
  incrementInboxUnreadMany,
  type InboxStateSnapshot,
} from './notification-inbox-state.ops';
import {
  isNotificationBulkWriteEnabled,
  isNotificationSseFromInboxStateEnabled,
  resolveNotificationBatchConcurrency,
} from './notification-command.flags';
import { mapWithConcurrency } from './map-with-concurrency';
import { recordNotificationMetric } from './notification-metrics';
import { NotificationRuleCacheService } from './notification-rule-cache.service';
import { resolveNotificationRuleConfig } from './notification-rules';
import type { CreateNotificationParams, NotificationRow } from './notification.service';

const USER_PREF_RULE_PREFIX = 'user_pref';

type InAppRow = {
  id: string;
  recipientEmployeeId: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  link: string | null;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
};

export type CreateManyNotificationCommand = {
  recipientIds: string[];
  type: string;
  title: string;
  body: string;
  link?: string;
  actionLabel?: string;
  category?: string;
  priority?: string;
  entityType?: string;
  entityId?: string;
  sourceModule?: string;
  /** Prefix; final key = `${prefix}:${recipientId}` or with suffix. */
  dedupeKeyPrefix: string;
  /** Optional: `${prefix}:${recipientId}:${suffix}` */
  dedupeKeySuffix?: string;
  payload?: InputJsonValue;
};

export type CreateManyResult = {
  requested: number;
  filtered: number;
  inserted: number;
  duplicatesSkipped: number;
  rows: NotificationRow[];
};

/**
 * Optimized write path (feature-flagged). Avoids rule upsert per event,
 * batches preferences for createMany, and set-based InboxState updates.
 */
@Injectable()
export class NotificationCommandService {
  private readonly logger = new Logger(NotificationCommandService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly ruleCache: NotificationRuleCacheService,
    @Optional() private readonly realtimePublisher?: NotificationRealtimePublisher,
  ) {}

  async createOne(params: CreateNotificationParams): Promise<NotificationRow> {
    const started = Date.now();
    const pref = await this.loadPreference(params.recipientId, params.type);
    if (!pref.enabled || !pref.channels.includes('IN_APP')) {
      recordNotificationMetric({
        name: 'notification_create_duration_ms',
        value: Date.now() - started,
        tags: { path: 'v2', outcome: 'skipped' },
      });
      return skippedRow(params);
    }

    const ruleConfig = resolveNotificationRuleConfig(params.type);
    const priority = params.priority ?? ruleConfig.priority;
    const category = params.category ?? ruleConfig.category;
    const fingerprint = fingerprintOf(params);
    const dedupeKey = params.dedupeKey ?? `in_app:${fingerprint}`;
    const idempotencyKey = params.idempotencyKey ?? `direct:${fingerprint}`;
    const ruleId = await this.ruleCache.getOrCreateRuleId(params.type, priority);

    const result = await this.prisma.$transaction(async (tx) => {
      const existingJob = await tx.notificationJob.findUnique({ where: { dedupeKey } });
      if (existingJob) {
        const existing = await tx.inAppNotification.findFirst({
          where: whereInApp(params),
          orderBy: { createdAt: 'desc' },
        });
        if (existing) {
          return { row: existing, created: false as const, inbox: undefined };
        }
      }

      const event = await tx.notificationEvent.upsert({
        where: { idempotencyKey },
        update: {},
        create: {
          eventType: params.type,
          sourceModule: params.sourceModule ?? 'notifications',
          sourceEntityType: params.entityType ?? null,
          sourceEntityId: params.entityId ?? null,
          payload: params.payload,
          idempotencyKey,
        },
      });

      let job;
      try {
        job = await tx.notificationJob.create({
          data: {
            eventId: event.id,
            ruleId,
            status: 'DELIVERED',
            processedAt: new Date(),
            dedupeKey,
          },
        });
      } catch {
        const again = await tx.inAppNotification.findFirst({
          where: whereInApp(params),
          orderBy: { createdAt: 'desc' },
        });
        if (again) return { row: again, created: false as const, inbox: undefined };
        throw new Error(`Failed to create notification job for ${dedupeKey}`);
      }

      await tx.notificationDelivery.create({
        data: {
          jobId: job.id,
          channel: 'IN_APP',
          recipient: params.recipientId,
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      const created = await tx.inAppNotification.create({
        data: {
          recipientEmployeeId: params.recipientId,
          type: params.type,
          category,
          priority,
          title: params.title,
          body: params.body,
          link: params.link ?? null,
          actionLabel: params.actionLabel ?? null,
          entityType: params.entityType ?? null,
          entityId: params.entityId ?? null,
        },
      });

      let inbox: InboxStateSnapshot | undefined;
      if (isNotificationInboxStateWriteEnabled()) {
        inbox = await incrementInboxUnread(tx, params.recipientId);
      }
      return { row: created, created: true as const, inbox };
    });

    if (result.created) {
      await this.publishAfterCommit(params.recipientId, result.inbox);
    }
    recordNotificationMetric({
      name: 'notification_create_duration_ms',
      value: Date.now() - started,
      tags: {
        path: 'v2',
        outcome: result.created ? 'inserted' : 'duplicate',
      },
    });
    return toRow(result.row);
  }

  async createMany(command: CreateManyNotificationCommand): Promise<CreateManyResult> {
    const started = Date.now();
    const uniqueRecipients = [...new Set(command.recipientIds.filter(Boolean))];
    if (uniqueRecipients.length === 0) {
      return emptyMany(0);
    }

    if (!isNotificationBulkWriteEnabled()) {
      const rows: NotificationRow[] = [];
      let inserted = 0;
      let skipped = 0;
      const concurrency = resolveNotificationBatchConcurrency();
      await mapWithConcurrency(uniqueRecipients, concurrency, async (recipientId) => {
        const row = await this.createOne({
          ...command,
          recipientId,
          dedupeKey: buildDedupeKey(command, recipientId),
          idempotencyKey: buildDedupeKey(command, recipientId),
        });
        if (row.id.startsWith('skipped:')) skipped += 1;
        else inserted += 1;
        rows.push(row);
      });
      const result = {
        requested: uniqueRecipients.length,
        filtered: skipped,
        inserted,
        duplicatesSkipped: 0,
        rows,
      };
      recordBulkMetrics(started, result);
      return result;
    }

    const prefMap = await this.loadPreferencesBatch(uniqueRecipients, command.type);
    const eligible = uniqueRecipients.filter((id) => {
      const pref = prefMap.get(id) ?? { enabled: true, channels: ['IN_APP'] };
      return pref.enabled && pref.channels.includes('IN_APP');
    });
    const filteredOut = uniqueRecipients.length - eligible.length;
    recordNotificationMetric({
      name: 'notification_recipients_requested',
      value: uniqueRecipients.length,
    });
    recordNotificationMetric({
      name: 'notification_recipients_filtered',
      value: filteredOut,
    });

    if (eligible.length === 0) {
      const empty = {
        requested: uniqueRecipients.length,
        filtered: filteredOut,
        inserted: 0,
        duplicatesSkipped: 0,
        rows: [] as NotificationRow[],
      };
      recordBulkMetrics(started, empty);
      return empty;
    }

    const ruleConfig = resolveNotificationRuleConfig(command.type);
    const priority = command.priority ?? ruleConfig.priority;
    const category = command.category ?? ruleConfig.category;
    const ruleId = await this.ruleCache.getOrCreateRuleId(command.type, priority);

    const keys = eligible.map((recipientId) => ({
      recipientId,
      dedupeKey: buildDedupeKey(command, recipientId),
      idempotencyKey: buildDedupeKey(command, recipientId),
    }));

    const existingJobs = await this.prisma.notificationJob.findMany({
      where: { dedupeKey: { in: keys.map((k) => k.dedupeKey) } },
      select: { dedupeKey: true },
    });
    const existingKeys = new Set(existingJobs.map((j) => j.dedupeKey));
    const toInsert = keys.filter((k) => !existingKeys.has(k.dedupeKey));
    const duplicatesSkipped = keys.length - toInsert.length;

    if (toInsert.length === 0) {
      const empty = {
        requested: uniqueRecipients.length,
        filtered: filteredOut,
        inserted: 0,
        duplicatesSkipped,
        rows: [] as NotificationRow[],
      };
      recordBulkMetrics(started, empty);
      return empty;
    }

    const snapshots = new Map<string, InboxStateSnapshot>();
    const bulk = await this.insertBulkSetBased(command, ruleId, category, priority, toInsert);
    for (const [id, snap] of bulk.inboxSnapshots) {
      snapshots.set(id, snap);
    }

    await this.publishManyAfterCommit(snapshots, [
      ...new Set(bulk.rows.map((r) => r.recipientEmployeeId)),
    ]);

    this.logger.log(
      `createMany type=${command.type} requested=${uniqueRecipients.length} inserted=${bulk.rows.length} dupes=${duplicatesSkipped} filtered=${filteredOut}`,
    );

    const result = {
      requested: uniqueRecipients.length,
      filtered: filteredOut,
      inserted: bulk.rows.length,
      duplicatesSkipped,
      rows: bulk.rows.map(toRow),
    };
    recordNotificationMetric({
      name: 'notification_rows_inserted',
      value: result.inserted,
    });
    recordNotificationMetric({
      name: 'notification_duplicates_skipped',
      value: duplicatesSkipped,
    });
    recordBulkMetrics(started, result);
    return result;
  }

  private async insertBulkSetBased(
    command: CreateManyNotificationCommand,
    ruleId: string,
    category: string,
    priority: string,
    toInsert: Array<{ recipientId: string; dedupeKey: string; idempotencyKey: string }>,
  ): Promise<{ rows: InAppRow[]; inboxSnapshots: Map<string, InboxStateSnapshot> }> {
    const sourceModule = command.sourceModule ?? 'notifications';
    const entityType = command.entityType ?? null;
    const entityId = command.entityId ?? null;
    const payloadJson = command.payload === undefined ? null : JSON.stringify(command.payload);
    const idempotencyKeys = toInsert.map((k) => k.idempotencyKey);
    const dedupeKeys = toInsert.map((k) => k.dedupeKey);
    const recipientIds = toInsert.map((k) => k.recipientId);

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO notification_events (
          id, event_type, source_module, source_entity_type, source_entity_id, payload, idempotency_key
        )
        SELECT
          gen_random_uuid()::text,
          ${command.type},
          ${sourceModule},
          ${entityType},
          ${entityId},
          ${payloadJson}::jsonb,
          t.idempotency_key
        FROM unnest(${idempotencyKeys}::text[]) AS t(idempotency_key)
        ON CONFLICT (idempotency_key) DO NOTHING
      `;

      const events = await tx.notificationEvent.findMany({
        where: { idempotencyKey: { in: idempotencyKeys } },
        select: { id: true, idempotencyKey: true },
      });
      const eventIdByKey = new Map(events.map((e) => [e.idempotencyKey, e.id]));

      const eventIdsAligned: string[] = [];
      const dedupeAligned: string[] = [];
      const recipientAligned: string[] = [];
      for (let i = 0; i < toInsert.length; i += 1) {
        const item = toInsert[i]!;
        const eventId = eventIdByKey.get(item.idempotencyKey);
        if (!eventId) continue;
        eventIdsAligned.push(eventId);
        dedupeAligned.push(dedupeKeys[i]!);
        recipientAligned.push(recipientIds[i]!);
      }

      if (eventIdsAligned.length === 0) {
        return { rows: [], inboxSnapshots: new Map() };
      }

      const insertedJobs = await tx.$queryRaw<Array<{ id: string; dedupe_key: string }>>`
        INSERT INTO notification_jobs (
          id, event_id, rule_id, status, processed_at, dedupe_key
        )
        SELECT
          gen_random_uuid()::text,
          t.event_id,
          ${ruleId},
          'DELIVERED'::"NotificationJobStatus",
          CURRENT_TIMESTAMP,
          t.dedupe_key
        FROM unnest(
          ${eventIdsAligned}::text[],
          ${dedupeAligned}::text[]
        ) AS t(event_id, dedupe_key)
        ON CONFLICT (dedupe_key) DO NOTHING
        RETURNING id, dedupe_key
      `;

      if (insertedJobs.length === 0) {
        return { rows: [], inboxSnapshots: new Map() };
      }

      const recipientByDedupe = new Map(
        dedupeAligned.map((key, idx) => [key, recipientAligned[idx]!]),
      );
      const jobIds: string[] = [];
      const deliveryRecipients: string[] = [];
      const notifRecipients: string[] = [];
      for (const job of insertedJobs) {
        const recipientId = recipientByDedupe.get(job.dedupe_key);
        if (!recipientId) continue;
        jobIds.push(job.id);
        deliveryRecipients.push(recipientId);
        notifRecipients.push(recipientId);
      }

      await tx.$executeRaw`
        INSERT INTO notification_deliveries (
          id, job_id, channel, recipient, status, delivered_at
        )
        SELECT
          gen_random_uuid()::text,
          t.job_id,
          'IN_APP'::"NotificationDeliveryChannel",
          t.recipient,
          'DELIVERED'::"NotificationDeliveryStatus",
          CURRENT_TIMESTAMP
        FROM unnest(
          ${jobIds}::text[],
          ${deliveryRecipients}::text[]
        ) AS t(job_id, recipient)
        ON CONFLICT (job_id, channel) DO NOTHING
      `;

      const rows = await tx.$queryRaw<InAppRow[]>`
        INSERT INTO in_app_notifications (
          id, recipient_employee_id, type, category, priority, title, body,
          link, action_label, entity_type, entity_id
        )
        SELECT
          gen_random_uuid()::text,
          t.recipient_id,
          ${command.type},
          ${category},
          ${priority},
          ${command.title},
          ${command.body},
          ${command.link ?? null},
          ${command.actionLabel ?? null},
          ${entityType},
          ${entityId}
        FROM unnest(${notifRecipients}::text[]) AS t(recipient_id)
        RETURNING
          id,
          recipient_employee_id AS "recipientEmployeeId",
          type,
          category,
          priority,
          title,
          body,
          link,
          action_label AS "actionLabel",
          entity_type AS "entityType",
          entity_id AS "entityId",
          is_read AS "isRead",
          read_at AS "readAt",
          archived_at AS "archivedAt",
          created_at AS "createdAt"
      `;

      recordNotificationMetric({
        name: 'notification_delivery_rows_created',
        value: jobIds.length,
      });

      const inboxSnapshots = new Map<string, InboxStateSnapshot>();
      if (isNotificationInboxStateWriteEnabled() && rows.length > 0) {
        const deltas = new Map<string, number>();
        for (const row of rows) {
          deltas.set(row.recipientEmployeeId, (deltas.get(row.recipientEmployeeId) ?? 0) + 1);
        }
        const bumped = await incrementInboxUnreadMany(tx, deltas);
        for (const [id, snap] of bumped) inboxSnapshots.set(id, snap);
        recordNotificationMetric({
          name: 'notification_inbox_states_updated',
          value: bumped.size,
        });
      }

      return { rows, inboxSnapshots };
    });
  }

  private async loadPreference(
    userId: string,
    eventType: string,
  ): Promise<{ enabled: boolean; channels: string[] }> {
    const row = await this.prisma.notificationRule.findUnique({
      where: { code: `${USER_PREF_RULE_PREFIX}:${userId}:${eventType}` },
      select: { enabled: true, channels: true },
    });
    if (!row) return { enabled: true, channels: ['IN_APP'] };
    return {
      enabled: row.enabled,
      channels: row.channels?.length ? row.channels : ['IN_APP'],
    };
  }

  private async loadPreferencesBatch(
    recipientIds: string[],
    eventType: string,
  ): Promise<Map<string, { enabled: boolean; channels: string[] }>> {
    const codes = recipientIds.map((id) => `${USER_PREF_RULE_PREFIX}:${id}:${eventType}`);
    const rows = await this.prisma.notificationRule.findMany({
      where: { code: { in: codes } },
      select: { code: true, enabled: true, channels: true },
    });
    const map = new Map<string, { enabled: boolean; channels: string[] }>();
    for (const row of rows) {
      const parts = row.code.split(':');
      const employeeId = parts[1];
      if (!employeeId) continue;
      map.set(employeeId, {
        enabled: row.enabled,
        channels: row.channels?.length ? row.channels : ['IN_APP'],
      });
    }
    return map;
  }

  private async publishAfterCommit(
    employeeId: string,
    snapshot: InboxStateSnapshot | undefined,
  ): Promise<void> {
    if (!this.realtimePublisher) return;
    if (snapshot && isNotificationSseFromInboxStateEnabled()) {
      await this.realtimePublisher.publishSnapshot(employeeId, snapshot, {
        invalidateList: true,
      });
      recordNotificationMetric({ name: 'notification_sse_events_published', value: 1 });
      return;
    }
    await this.realtimePublisher.publishUnreadState(employeeId, { invalidateList: true });
    recordNotificationMetric({ name: 'notification_sse_events_published', value: 1 });
  }

  private async publishManyAfterCommit(
    snapshots: Map<string, InboxStateSnapshot>,
    employeeIds: string[],
  ): Promise<void> {
    if (!this.realtimePublisher) return;
    const concurrency = resolveNotificationBatchConcurrency();
    const useSnapshot = isNotificationSseFromInboxStateEnabled();

    await mapWithConcurrency(employeeIds, concurrency, async (employeeId) => {
      const snap = snapshots.get(employeeId);
      if (useSnapshot && snap) {
        await this.realtimePublisher!.publishSnapshot(employeeId, snap, {
          invalidateList: true,
        });
        return;
      }
      await this.realtimePublisher!.publishUnreadState(employeeId, { invalidateList: true });
    });
    recordNotificationMetric({
      name: 'notification_sse_events_published',
      value: employeeIds.length,
    });
  }
}

function buildDedupeKey(command: CreateManyNotificationCommand, recipientId: string): string {
  if (command.dedupeKeySuffix) {
    return `${command.dedupeKeyPrefix}:${recipientId}:${command.dedupeKeySuffix}`;
  }
  return `${command.dedupeKeyPrefix}:${recipientId}`;
}

function fingerprintOf(params: CreateNotificationParams): string {
  const entity =
    params.entityType && params.entityId ? `${params.entityType}:${params.entityId}` : params.title;
  return [params.type, params.recipientId, entity].join(':');
}

function whereInApp(params: CreateNotificationParams) {
  const base = {
    recipientEmployeeId: params.recipientId,
    type: params.type,
    title: params.title,
    body: params.body,
  };
  if (params.entityType && params.entityId) {
    return { ...base, entityType: params.entityType, entityId: params.entityId };
  }
  return base;
}

function toRow(row: InAppRow): NotificationRow {
  return {
    id: row.id,
    type: row.type,
    recipientId: row.recipientEmployeeId,
    category: row.category,
    priority: row.priority,
    title: row.title,
    body: row.body,
    link: row.link,
    actionLabel: row.actionLabel,
    entityType: row.entityType,
    entityId: row.entityId,
    isRead: row.isRead,
    createdAt: row.createdAt,
    readAt: row.readAt,
    archivedAt: row.archivedAt,
  };
}

function skippedRow(params: CreateNotificationParams): NotificationRow {
  const skippedAt = new Date();
  return {
    id: `skipped:${params.recipientId}:${params.type}:${skippedAt.getTime()}`,
    type: params.type,
    recipientId: params.recipientId,
    category: params.category ?? 'informational',
    priority: params.priority ?? 'normal',
    title: params.title,
    body: params.body,
    link: params.link ?? null,
    actionLabel: params.actionLabel ?? null,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    isRead: true,
    createdAt: skippedAt,
    readAt: skippedAt,
    archivedAt: skippedAt,
  };
}

function emptyMany(requested: number): CreateManyResult {
  return {
    requested,
    filtered: 0,
    inserted: 0,
    duplicatesSkipped: 0,
    rows: [],
  };
}

function recordBulkMetrics(started: number, result: CreateManyResult): void {
  recordNotificationMetric({
    name: 'notification_bulk_create_duration_ms',
    value: Date.now() - started,
    tags: {
      inserted: String(result.inserted),
      requested: String(result.requested),
    },
  });
}
