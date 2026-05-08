import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, type Prisma, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

export interface AuditActorSummary {
  id: string;
  firstName: string;
  lastName: string;
}

type AuditLogRow = Prisma.AuditLogModel;

export type AuditLogWithActor = AuditLogRow & { actor: AuditActorSummary | null };

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

    const itemsWithActors = await this.attachActorsToLogs(items);

    return {
      items: itemsWithActors,
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

    const itemsWithActors = await this.attachActorsToLogs(items);

    return {
      items: itemsWithActors,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private async attachActorsToLogs(rows: AuditLogRow[]): Promise<AuditLogWithActor[]> {
    const ids = [...new Set(rows.map((row) => row.userId))];
    if (ids.length === 0) {
      return rows.map((row) => ({ ...row, actor: null }));
    }

    const employees = await this.prisma.employee.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true },
    });
    const byId = new Map(employees.map((e) => [e.id, e]));

    return rows.map((row) => ({
      ...row,
      actor: byId.get(row.userId) ?? null,
    }));
  }
}
