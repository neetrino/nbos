import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { attachActorsToAuditLogs } from './audit-actor.resolver';
import { toAuditLogCreateData } from './audit-log-write.mapper';
import {
  AUDIT_DEFAULT_PAGE,
  AUDIT_DEFAULT_PAGE_SIZE,
  type AuditLogParams,
  type PaginationParams,
} from './audit-log.params';

export type { AuditActorSummary, AuditLogWithActor } from './audit-actor.resolver';
export type { AuditLogParams } from './audit-log.params';

@Injectable()
export class AuditService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async log(params: AuditLogParams) {
    return this.prisma.auditLog.create({
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
      items: await attachActorsToAuditLogs(this.prisma, items),
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
      items: await attachActorsToAuditLogs(this.prisma, items),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
