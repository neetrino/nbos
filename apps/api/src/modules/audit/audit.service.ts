import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { attachActorsToAuditLogs, type AuditActorLookups } from './audit-actor.resolver';
import { toAuditLogCreateData } from './audit-log-write.mapper';
import {
  AUDIT_LOG_PAGE_ORDER,
  normalizeAuditPagination,
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
    const { page, pageSize } = normalizeAuditPagination(pagination);
    const where = { entityType, entityId };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: AUDIT_LOG_PAGE_ORDER,
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
    const { page, pageSize } = normalizeAuditPagination(pagination);
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: AUDIT_LOG_PAGE_ORDER,
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

  async findRecentByEntityTypes(entityTypes: string[], pagination: PaginationParams = {}) {
    const { page, pageSize } = normalizeAuditPagination(pagination);
    if (entityTypes.length === 0) {
      return { items: [], meta: { total: 0, page, pageSize, totalPages: 0 } };
    }
    const where = { entityType: { in: entityTypes } };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: AUDIT_LOG_PAGE_ORDER,
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

  async findRecentByEntityRefs(
    refs: Array<{ entityType: string; entityId: string }>,
    pagination: PaginationParams = {},
  ) {
    const { page, pageSize } = normalizeAuditPagination(pagination);
    if (refs.length === 0) {
      return { items: [], meta: { total: 0, page, pageSize, totalPages: 0 } };
    }
    const where = {
      OR: refs.map((ref) => ({ entityType: ref.entityType, entityId: ref.entityId })),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: AUDIT_LOG_PAGE_ORDER,
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
