import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { attachActorsToAuditLogs, type AuditActorLookups } from './audit-actor.resolver';
import { toAuditLogCreateData } from './audit-log-write.mapper';
import {
  AUDIT_DEFAULT_PAGE,
  AUDIT_DEFAULT_PAGE_SIZE,
  type AuditLogParams,
  type PaginationParams,
} from './audit-log.params';

export type { AuditActorSummary, AuditLogWithActor } from './audit-actor.resolver';
export type { AuditLogParams } from './audit-log.params';

/**
 * Minimal write surface so a caller can persist its audit row inside its own
 * transaction, keeping a security-relevant mutation and its trail atomic.
 */
export type AuditWriteClient = Pick<InstanceType<typeof PrismaClient>, 'auditLog'>;

@Injectable()
export class AuditService {
  private actorLookups: AuditActorLookups = {};

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Registers batch display-name resolvers for machine actors.
   *
   * Owning modules register themselves at boot, so Audit never has to depend on
   * (and import) the AI Platform module.
   */
  registerActorLookups(lookups: AuditActorLookups): void {
    this.actorLookups = { ...this.actorLookups, ...lookups };
  }

  async log(params: AuditLogParams, client: AuditWriteClient = this.prisma) {
    return client.auditLog.create({
      data: toAuditLogCreateData(params),
    });
  }

  async findByEntity(entityType: string, entityId: string, pagination: PaginationParams = {}) {
    const { page = AUDIT_DEFAULT_PAGE, pageSize = AUDIT_DEFAULT_PAGE_SIZE } = pagination;
    const where = { entityType, entityId };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      items: await attachActorsToAuditLogs(this.prisma, items, this.actorLookups),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findByUser(userId: string, pagination: PaginationParams = {}) {
    const { page = AUDIT_DEFAULT_PAGE, pageSize = AUDIT_DEFAULT_PAGE_SIZE } = pagination;
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      items: await attachActorsToAuditLogs(this.prisma, items, this.actorLookups),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
