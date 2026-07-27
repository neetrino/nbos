import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { NOTIFICATION_RULE_CONFIGS, resolveNotificationRuleConfig } from './notification-rules';

const DIRECT_IN_APP_RESOLVER = 'EXPLICIT_RECIPIENT';

export function directInAppRuleCode(eventType: string): string {
  return `in_app.${eventType}`;
}

/**
 * Ensures system `in_app.*` rules exist once at startup and caches id by code.
 * Hot path must not upsert rules per notification.
 */
@Injectable()
export class NotificationRuleCacheService implements OnModuleInit {
  private readonly logger = new Logger(NotificationRuleCacheService.name);
  private readonly ruleIdByCode = new Map<string, string>();

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSystemRules();
  }

  async ensureSystemRules(): Promise<void> {
    for (const config of NOTIFICATION_RULE_CONFIGS) {
      const code = directInAppRuleCode(config.eventType);
      const rule = await this.prisma.notificationRule.upsert({
        where: { code },
        update: { enabled: true, priority: config.priority },
        create: {
          code,
          eventType: config.eventType,
          recipientResolver: DIRECT_IN_APP_RESOLVER,
          priority: config.priority,
          channels: ['IN_APP'],
        },
        select: { id: true, code: true },
      });
      this.ruleIdByCode.set(rule.code, rule.id);
    }
    this.logger.log(`Notification system rules ready: ${this.ruleIdByCode.size}`);
  }

  /** Resolve rule id; create on demand for unknown dynamic event types (once). */
  async getOrCreateRuleId(eventType: string, priority?: string): Promise<string> {
    const config = resolveNotificationRuleConfig(eventType);
    const code = directInAppRuleCode(eventType);
    const cached = this.ruleIdByCode.get(code);
    if (cached) return cached;

    const rule = await this.prisma.notificationRule.upsert({
      where: { code },
      update: { enabled: true, priority: priority ?? config.priority },
      create: {
        code,
        eventType,
        recipientResolver: DIRECT_IN_APP_RESOLVER,
        priority: priority ?? config.priority,
        channels: ['IN_APP'],
      },
      select: { id: true, code: true },
    });
    this.ruleIdByCode.set(rule.code, rule.id);
    return rule.id;
  }
}
