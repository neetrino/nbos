import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, type Prisma, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  projectId?: string;
  changes?: InputJsonValue;
  ipAddress?: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async log(params: AuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        projectId: params.projectId,
        changes: params.changes ?? undefined,
        ipAddress: params.ipAddress,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 20 } = pagination;
    const where: Prisma.AuditLogWhereInput = { entityType, entityId };

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
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findByUser(userId: string, pagination: PaginationParams = {}) {
    const { page = 1, pageSize = 20 } = pagination;
    const where: Prisma.AuditLogWhereInput = { userId };

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
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
