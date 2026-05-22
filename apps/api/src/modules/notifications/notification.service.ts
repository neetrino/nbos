import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { resolveNotificationRuleConfig } from './notification-rules';

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

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async create(params: CreateNotificationParams): Promise<NotificationRow> {
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

    const row = await this.prisma.$transaction(async (tx) => {
      const fingerprint = notificationFingerprint(params);
      const dedupeKey = params.dedupeKey ?? `in_app:${fingerprint}`;
      const idempotencyKey = params.idempotencyKey ?? `direct:${fingerprint}`;
      const existingJob = await tx.notificationJob.findUnique({ where: { dedupeKey } });
      if (existingJob) {
        const existing = await tx.inAppNotification.findFirst({
          where: notificationWhere(params),
          orderBy: { createdAt: 'desc' },
        });
        if (existing) return existing;
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

      return tx.inAppNotification.create({
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
    });

    this.logger.log(`Notification created for user ${params.recipientId}: ${params.title}`);
    return toNotificationRow(row);
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
        orderBy: { createdAt: 'desc' },
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

  async archive(id: string, userId: string): Promise<NotificationRow> {
    const owned = await this.prisma.inAppNotification.findFirst({
      where: { id, recipientEmployeeId: userId },
    });
    if (!owned) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    const now = new Date();
    const row = await this.prisma.inAppNotification.update({
      where: { id },
      data: {
        archivedAt: now,
        isRead: true,
        readAt: owned.readAt ?? now,
      },
    });
    return toNotificationRow(row);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationRow> {
    const owned = await this.prisma.inAppNotification.findFirst({
      where: { id, recipientEmployeeId: userId },
    });
    if (!owned) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    const row = await this.prisma.inAppNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return toNotificationRow(row);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.inAppNotification.updateMany({
      where: {
        recipientEmployeeId: userId,
        isRead: false,
        archivedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return { updated: result.count };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.inAppNotification.count({
      where: {
        recipientEmployeeId: userId,
        isRead: false,
        archivedAt: null,
      },
    });
    return { count };
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
