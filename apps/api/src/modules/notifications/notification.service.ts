import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient, type InputJsonValue, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NotificationRealtimePublisher } from '../realtime/notification-realtime.publisher';
import {
  isNotificationInboxStateReadEnabled,
  isNotificationInboxStateWriteEnabled,
  isNotificationInboxStateShadowReadEnabled,
  resolveInboxShadowReadSampleRate,
} from './notification-inbox-state.flags';
import {
  isNotificationCommandV2Enabled,
  isNotificationSseFromInboxStateEnabled,
} from './notification-command.flags';
import { NotificationCommandService } from './notification-command.service';
import {
  decrementInboxUnread,
  incrementInboxUnread,
  readInboxState,
  resetInboxUnread,
  syncInboxUnreadToActual,
  type InboxStateSnapshot,
} from './notification-inbox-state.ops';
import { recordInboxMetric } from './notification-inbox-metrics';
import { decodeNotificationCursor, encodeNotificationCursor } from './notification-list-cursor';
import { resolveNotificationRuleConfig } from './notification-rules';
import { createHash } from 'node:crypto';

type InAppNotificationRow = {
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

export interface CreateNotificationParams {
  type: string;
  recipientId: string;
  title: string;
  body: string;
  link?: string;
  actionLabel?: string;
  category?: string;
  priority?: string;
  entityType?: string;
  entityId?: string;
  sourceModule?: string;
  idempotencyKey?: string;
  dedupeKey?: string;
  payload?: InputJsonValue;
}

export interface NotificationRow {
  id: string;
  type: string;
  recipientId: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  link: string | null;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
  archivedAt: Date | null;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  category?: string;
  includeArchived?: boolean;
}

interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  category?: string;
  includeArchived?: boolean;
}

export interface NotificationCursorListResult {
  items: NotificationRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationPreferenceRow {
  eventType: string;
  enabled: boolean;
  channels: string[];
}

export interface NotificationAdminRuleRow {
  code: string;
  eventType: string;
  recipientResolver: string;
  enabled: boolean;
  priority: string;
  channels: string[];
}

const USER_PREF_RULE_PREFIX = 'user_pref';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DIRECT_IN_APP_RESOLVER = 'EXPLICIT_RECIPIENT';

function normalizePage(value: number | undefined): number {
  return value && value > 0 ? value : DEFAULT_PAGE;
}

function normalizePageSize(value: number | undefined): number {
  if (!value || value < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(value, DEFAULT_PAGE_SIZE);
}

function notificationFingerprint(params: CreateNotificationParams): string {
  const entity =
    params.entityType && params.entityId ? `${params.entityType}:${params.entityId}` : params.title;
  return [params.type, params.recipientId, entity].join(':');
}

function directRuleCode(eventType: string): string {
  return `in_app.${eventType}`;
}

function userPreferenceRuleCode(employeeId: string, eventType: string): string {
  return `${USER_PREF_RULE_PREFIX}:${employeeId}:${eventType}`;
}

function notificationWhere(params: CreateNotificationParams) {
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

function toNotificationRow(row: InAppNotificationRow): NotificationRow {
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

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    @Optional() private readonly realtimePublisher?: NotificationRealtimePublisher,
    @Optional() private readonly commands?: NotificationCommandService,
  ) {}

  async create(params: CreateNotificationParams): Promise<NotificationRow> {
    if (isNotificationCommandV2Enabled() && this.commands) {
      return this.commands.createOne(params);
    }
    return this.createLegacy(params);
  }

  /** Multi-recipient create — uses V2/bulk path when flags enabled. */
  async createMany(
    command: import('./notification-command.service').CreateManyNotificationCommand,
  ): Promise<import('./notification-command.service').CreateManyResult> {
    if (isNotificationCommandV2Enabled() && this.commands) {
      return this.commands.createMany(command);
    }
    const uniqueRecipients = [...new Set(command.recipientIds.filter(Boolean))];
    const rows: NotificationRow[] = [];
    let inserted = 0;
    let filtered = 0;
    for (const recipientId of uniqueRecipients) {
      const dedupeKey = command.dedupeKeySuffix
        ? `${command.dedupeKeyPrefix}:${recipientId}:${command.dedupeKeySuffix}`
        : `${command.dedupeKeyPrefix}:${recipientId}`;
      const row = await this.createLegacy({
        type: command.type,
        recipientId,
        title: command.title,
        body: command.body,
        link: command.link,
        actionLabel: command.actionLabel,
        category: command.category,
        priority: command.priority,
        entityType: command.entityType,
        entityId: command.entityId,
        sourceModule: command.sourceModule,
        dedupeKey,
        idempotencyKey: dedupeKey,
        payload: command.payload,
      });
      if (row.id.startsWith('skipped:')) filtered += 1;
      else inserted += 1;
      rows.push(row);
    }
    return {
      requested: uniqueRecipients.length,
      filtered,
      inserted,
      duplicatesSkipped: 0,
      rows,
    };
  }

  private async createLegacy(params: CreateNotificationParams): Promise<NotificationRow> {
    const userPref = await this.resolveUserPreference(params.recipientId, params.type);
    if (!userPref.enabled || !userPref.channels.includes('IN_APP')) {
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

    const ruleConfig = resolveNotificationRuleConfig(params.type);
    const priority = params.priority ?? ruleConfig.priority;
    const category = params.category ?? ruleConfig.category;

    const result = await this.prisma.$transaction(async (tx) => {
      const fingerprint = notificationFingerprint(params);
      const dedupeKey = params.dedupeKey ?? `in_app:${fingerprint}`;
      const idempotencyKey = params.idempotencyKey ?? `direct:${fingerprint}`;
      const existingJob = await tx.notificationJob.findUnique({ where: { dedupeKey } });
      if (existingJob) {
        const existing = await tx.inAppNotification.findFirst({
          where: notificationWhere(params),
          orderBy: { createdAt: 'desc' },
        });
        if (existing) {
          return { row: existing, created: false as const, inbox: undefined };
        }
      }

      const rule = await tx.notificationRule.upsert({
        where: { code: directRuleCode(params.type) },
        update: { enabled: true, priority },
        create: {
          code: directRuleCode(params.type),
          eventType: params.type,
          recipientResolver: DIRECT_IN_APP_RESOLVER,
          priority,
        },
      });

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

      const job = await tx.notificationJob.create({
        data: {
          eventId: event.id,
          ruleId: rule.id,
          status: 'DELIVERED',
          processedAt: new Date(),
          dedupeKey,
        },
      });

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

    this.logger.log(`Notification created for user ${params.recipientId}: ${params.title}`);
    if (result.created) {
      await this.emitRealtime(params.recipientId, {
        invalidateList: true,
        snapshot: result.inbox,
      });
    }
    return toNotificationRow(result.row);
  }

  async findByUser(userId: string, pagination: PaginationParams = {}) {
    const page = normalizePage(pagination.page);
    const pageSize = normalizePageSize(pagination.pageSize);
    const where = {
      recipientEmployeeId: userId,
      ...(pagination.category ? { category: pagination.category } : {}),
      ...(pagination.includeArchived ? {} : { archivedAt: null }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.inAppNotification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.inAppNotification.count({ where }),
    ]);

    return {
      items: rows.map(toNotificationRow),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Cursor list for dropdown / infinite scroll — **no COUNT(*)**.
   * Sort: createdAt DESC, id DESC. Uses take+1 for hasMore.
   */
  async findByUserCursor(
    userId: string,
    pagination: CursorPaginationParams = {},
  ): Promise<NotificationCursorListResult> {
    const limit = normalizePageSize(pagination.limit);
    const where: Prisma.InAppNotificationWhereInput = {
      recipientEmployeeId: userId,
      ...(pagination.category ? { category: pagination.category } : {}),
      ...(pagination.includeArchived ? {} : { archivedAt: null }),
    };

    if (pagination.cursor) {
      const decoded = decodeNotificationCursor(pagination.cursor);
      if (!decoded) {
        throw new BadRequestException('Invalid notification cursor');
      }
      const cursorDate = new Date(decoded.createdAt);
      where.AND = [
        {
          OR: [
            { createdAt: { lt: cursorDate } },
            { createdAt: cursorDate, id: { lt: decoded.id } },
          ],
        },
      ];
    }

    const rows = await this.prisma.inAppNotification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeNotificationCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null;

    return {
      items: pageRows.map(toNotificationRow),
      nextCursor,
      hasMore,
    };
  }

  async archive(id: string, userId: string): Promise<NotificationRow> {
    const writeInbox = isNotificationInboxStateWriteEnabled();
    const now = new Date();

    if (!writeInbox) {
      const owned = await this.prisma.inAppNotification.findFirst({
        where: { id, recipientEmployeeId: userId },
      });
      if (!owned) {
        throw new NotFoundException(`Notification ${id} not found`);
      }
      if (owned.archivedAt) {
        return toNotificationRow(owned);
      }
      const row = await this.prisma.inAppNotification.update({
        where: { id },
        data: {
          archivedAt: now,
          isRead: true,
          readAt: owned.readAt ?? now,
        },
      });
      if (!owned.isRead) {
        await this.emitRealtime(userId, { invalidateList: true });
      }
      return toNotificationRow(row);
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.$queryRaw<Array<InAppNotificationRow & { was_unread: boolean }>>`
        WITH picked AS (
          SELECT id, is_read AS was_unread
          FROM in_app_notifications
          WHERE id = ${id}
            AND recipient_employee_id = ${userId}
            AND archived_at IS NULL
          FOR UPDATE
        ),
        upd AS (
          UPDATE in_app_notifications n
          SET
            archived_at = CURRENT_TIMESTAMP,
            is_read = true,
            read_at = COALESCE(n.read_at, CURRENT_TIMESTAMP)
          FROM picked
          WHERE n.id = picked.id
          RETURNING
            n.id,
            n.recipient_employee_id AS "recipientEmployeeId",
            n.type,
            n.category,
            n.priority,
            n.title,
            n.body,
            n.link,
            n.action_label AS "actionLabel",
            n.entity_type AS "entityType",
            n.entity_id AS "entityId",
            n.is_read AS "isRead",
            n.read_at AS "readAt",
            n.archived_at AS "archivedAt",
            n.created_at AS "createdAt",
            picked.was_unread
        )
        SELECT * FROM upd
      `;
      if (updated[0]) {
        let inbox: InboxStateSnapshot | undefined;
        if (updated[0].was_unread) {
          inbox = await decrementInboxUnread(tx, userId);
        }
        return {
          row: updated[0],
          changed: true as const,
          wasUnread: updated[0].was_unread,
          inbox,
        };
      }
      const owned = await tx.inAppNotification.findFirst({
        where: { id, recipientEmployeeId: userId },
      });
      if (!owned) {
        throw new NotFoundException(`Notification ${id} not found`);
      }
      return {
        row: owned,
        changed: false as const,
        wasUnread: false,
        inbox: undefined,
      };
    });

    if (outcome.changed && outcome.wasUnread) {
      await this.emitRealtime(userId, { invalidateList: true, snapshot: outcome.inbox });
    }
    return toNotificationRow(outcome.row);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationRow> {
    const writeInbox = isNotificationInboxStateWriteEnabled();

    if (!writeInbox) {
      const owned = await this.prisma.inAppNotification.findFirst({
        where: { id, recipientEmployeeId: userId },
      });
      if (!owned) {
        throw new NotFoundException(`Notification ${id} not found`);
      }
      if (owned.isRead) {
        return toNotificationRow(owned);
      }
      const row = await this.prisma.inAppNotification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
      await this.emitRealtime(userId, { invalidateList: true });
      return toNotificationRow(row);
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.$queryRaw<InAppNotificationRow[]>`
        UPDATE in_app_notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
          AND recipient_employee_id = ${userId}
          AND is_read = false
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
      if (updated[0]) {
        const inbox = await decrementInboxUnread(tx, userId);
        return { row: updated[0], changed: true as const, inbox };
      }
      const owned = await tx.inAppNotification.findFirst({
        where: { id, recipientEmployeeId: userId },
      });
      if (!owned) {
        throw new NotFoundException(`Notification ${id} not found`);
      }
      return { row: owned, changed: false as const, inbox: undefined };
    });

    if (outcome.changed) {
      await this.emitRealtime(userId, { invalidateList: true, snapshot: outcome.inbox });
    }
    return toNotificationRow(outcome.row);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const writeInbox = isNotificationInboxStateWriteEnabled();

    if (!writeInbox) {
      const result = await this.prisma.inAppNotification.updateMany({
        where: {
          recipientEmployeeId: userId,
          isRead: false,
          archivedAt: null,
        },
        data: { isRead: true, readAt: new Date() },
      });
      if (result.count > 0) {
        await this.emitRealtime(userId, { invalidateList: true });
      }
      return { updated: result.count };
    }

    const outcome = await this.prisma.$transaction(async (tx) => {
      const result = await tx.$queryRaw<Array<{ updated: bigint }>>`
        WITH updated AS (
          UPDATE in_app_notifications
          SET is_read = true, read_at = CURRENT_TIMESTAMP
          WHERE recipient_employee_id = ${userId}
            AND is_read = false
            AND archived_at IS NULL
          RETURNING id
        )
        SELECT count(*)::bigint AS updated FROM updated
      `;
      const updated = Number(result[0]?.updated ?? 0);
      let inbox: InboxStateSnapshot | undefined;
      if (updated > 0) {
        inbox = await resetInboxUnread(tx, userId);
      }
      return { updated, inbox };
    });

    if (outcome.updated > 0) {
      await this.emitRealtime(userId, { invalidateList: true, snapshot: outcome.inbox });
    }
    return { updated: outcome.updated };
  }

  async getUnreadCount(
    userId: string,
  ): Promise<{ count: number; version?: number; source?: 'inbox_state' | 'legacy_count' }> {
    const readEnabled = isNotificationInboxStateReadEnabled();
    const shadowEnabled = isNotificationInboxStateShadowReadEnabled();

    if (readEnabled) {
      const state = await readInboxState(this.prisma, userId);
      if (state) {
        return { count: state.unreadCount, version: state.version, source: 'inbox_state' };
      }
      recordInboxMetric('notification_inbox_missing_state_total');
      recordInboxMetric('notification_inbox_read_fallback_total');
      this.logger.warn(
        JSON.stringify({
          event: 'notification.inbox_state.missing_repaired',
          employeeIdHash: hashEmployeeId(userId),
        }),
      );
      const repaired = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
        const recount = await tx.inAppNotification.count({
          where: {
            recipientEmployeeId: userId,
            isRead: false,
            archivedAt: null,
          },
        });
        return syncInboxUnreadToActual(tx, userId, recount);
      });
      recordInboxMetric('notification_inbox_repair_total');
      return {
        count: repaired.unreadCount,
        version: repaired.version,
        source: 'inbox_state',
      };
    }

    const count = await this.countUnreadLegacy(userId);

    if (shadowEnabled && shouldSampleShadow(resolveInboxShadowReadSampleRate())) {
      try {
        const state = await readInboxState(this.prisma, userId);
        if (!state) {
          recordInboxMetric('notification_inbox_missing_state_total');
          this.logger.warn(
            JSON.stringify({
              event: 'notification.inbox_state.shadow_missing',
              employeeIdHash: hashEmployeeId(userId),
              legacyCount: count,
            }),
          );
        } else if (state.unreadCount !== count) {
          recordInboxMetric('notification_inbox_shadow_mismatch_total');
          recordInboxMetric('notification_inbox_drift_detected_total');
          this.logger.warn(
            JSON.stringify({
              event: 'notification.inbox_state.shadow_mismatch',
              employeeIdHash: hashEmployeeId(userId),
              legacyCount: count,
              inboxCount: state.unreadCount,
              version: state.version,
            }),
          );
        }
      } catch (err) {
        this.logger.warn(`Inbox shadow read failed: ${String(err)}`);
      }
    }

    return { count, source: 'legacy_count' };
  }

  private async countUnreadLegacy(userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: {
        recipientEmployeeId: userId,
        isRead: false,
        archivedAt: null,
      },
    });
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferenceRow[]> {
    const knownTypes = new Set<string>(resolveKnownNotificationEventTypes());
    const rows = await this.prisma.notificationRule.findMany({
      where: { code: { startsWith: `${USER_PREF_RULE_PREFIX}:${userId}:` } },
      orderBy: { eventType: 'asc' },
      select: {
        eventType: true,
        enabled: true,
        channels: true,
      },
    });
    for (const row of rows) knownTypes.add(row.eventType);
    return [...knownTypes]
      .sort((a, b) => a.localeCompare(b))
      .map((eventType) => {
        const override = rows.find((r) => r.eventType === eventType);
        return {
          eventType,
          enabled: override?.enabled ?? true,
          channels: override?.channels?.length ? override.channels : ['IN_APP'],
        };
      });
  }

  async listAdminRules(): Promise<NotificationAdminRuleRow[]> {
    const rows = await this.prisma.notificationRule.findMany({
      orderBy: [{ eventType: 'asc' }, { code: 'asc' }],
      select: {
        code: true,
        eventType: true,
        recipientResolver: true,
        enabled: true,
        priority: true,
        channels: true,
      },
    });
    return rows
      .filter((row) => !row.code.startsWith(`${USER_PREF_RULE_PREFIX}:`))
      .map((row) => ({
        code: row.code,
        eventType: row.eventType,
        recipientResolver: row.recipientResolver,
        enabled: row.enabled,
        priority: row.priority,
        channels: row.channels?.length ? row.channels : ['IN_APP'],
      }));
  }

  async patchAdminRule(
    code: string,
    patch: { enabled?: boolean; priority?: string; channels?: string[] },
  ): Promise<NotificationAdminRuleRow> {
    const channels = this.normalizeChannels(patch.channels);
    const priority = patch.priority?.trim().toLowerCase();
    const normalizedPriority =
      priority === 'critical' || priority === 'high' || priority === 'normal' || priority === 'low'
        ? priority
        : undefined;

    const row = await this.prisma.notificationRule.update({
      where: { code },
      data: {
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
        ...(normalizedPriority ? { priority: normalizedPriority } : {}),
        ...(channels ? { channels } : {}),
      },
      select: {
        code: true,
        eventType: true,
        recipientResolver: true,
        enabled: true,
        priority: true,
        channels: true,
      },
    });
    return {
      code: row.code,
      eventType: row.eventType,
      recipientResolver: row.recipientResolver,
      enabled: row.enabled,
      priority: row.priority,
      channels: row.channels?.length ? row.channels : ['IN_APP'],
    };
  }

  async updateUserPreference(
    userId: string,
    eventType: string,
    patch: { enabled?: boolean; channels?: string[] },
  ): Promise<NotificationPreferenceRow> {
    const normalizedChannels = this.normalizeChannels(patch.channels);
    const row = await this.prisma.notificationRule.upsert({
      where: { code: userPreferenceRuleCode(userId, eventType) },
      update: {
        ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
        ...(normalizedChannels ? { channels: normalizedChannels } : {}),
      },
      create: {
        code: userPreferenceRuleCode(userId, eventType),
        eventType,
        recipientResolver: DIRECT_IN_APP_RESOLVER,
        enabled: patch.enabled ?? true,
        channels: normalizedChannels ?? ['IN_APP'],
        priority: resolveNotificationRuleConfig(eventType).priority,
      },
      select: { eventType: true, enabled: true, channels: true },
    });
    return {
      eventType: row.eventType,
      enabled: row.enabled,
      channels: row.channels,
    };
  }

  private async resolveUserPreference(
    userId: string,
    eventType: string,
  ): Promise<NotificationPreferenceRow> {
    const row = await this.prisma.notificationRule.findUnique({
      where: { code: userPreferenceRuleCode(userId, eventType) },
      select: { eventType: true, enabled: true, channels: true },
    });
    if (!row) {
      return { eventType, enabled: true, channels: ['IN_APP'] };
    }
    return {
      eventType: row.eventType,
      enabled: row.enabled,
      channels: row.channels?.length ? row.channels : ['IN_APP'],
    };
  }

  private normalizeChannels(channels: string[] | undefined): string[] | undefined {
    if (!channels) return undefined;
    const normalized = [...new Set(channels.map((c) => c.trim().toUpperCase()).filter(Boolean))];
    const allowed = new Set(['IN_APP', 'EMAIL', 'TELEGRAM', 'WHATSAPP']);
    const filtered = normalized.filter((c) => allowed.has(c));
    if (filtered.length === 0) return ['IN_APP'];
    return filtered;
  }

  private async emitRealtime(
    employeeId: string,
    options?: { invalidateList?: boolean; snapshot?: InboxStateSnapshot },
  ): Promise<void> {
    if (!this.realtimePublisher) return;
    if (options?.snapshot && isNotificationSseFromInboxStateEnabled()) {
      await this.realtimePublisher.publishSnapshot(employeeId, options.snapshot, {
        invalidateList: options.invalidateList,
      });
      return;
    }
    await this.realtimePublisher.publishUnreadState(employeeId, options);
  }
}

function resolveKnownNotificationEventTypes(): string[] {
  return [
    'finance.wallet.bonus_active',
    'finance.wallet.bonus_paid',
    'finance.wallet.bonus_corrected',
    'finance.wallet.bonus_kpi_reduced',
    'finance.wallet.bonus_carry_applied',
    'finance.wallet.bonus_carry_deferred',
    'finance.wallet.payroll_created',
    'finance.wallet.payroll_closed',
    'finance.wallet.salary_payment',
    'finance.invoice.official_request_due',
    'finance.invoice.payment_reminder_due',
    'finance.invoice.payment_reminder_d10',
    'finance.invoice.payment_reminder_d2',
    'finance.expense.backlog_weekly_digest',
    'finance.expense.backlog_due_overdue',
    'task.overdue',
    'finance.overdue',
    'mail.health_degraded',
    'mail.send_failed',
    'document.access_changed',
    'credentials.high_risk_action',
  ];
}

function hashEmployeeId(employeeId: string): string {
  return createHash('sha256').update(employeeId).digest('hex').slice(0, 12);
}

function shouldSampleShadow(rate: number, random = Math.random): boolean {
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  return random() < rate;
}
