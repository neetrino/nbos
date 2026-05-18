import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { DriveEntityAccess } from './drive.service';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import type { ProjectDriveHubSummary, ProjectHubEntityRow } from './drive-project-hub.types';

const PROJECT_SCOPE = 'PROJECT';

@Injectable()
export class DriveProjectHubService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getSummary(projectId: string, access?: DriveEntityAccess): Promise<ProjectDriveHubSummary> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
      select: { id: true, code: true, name: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const accessWhere = await this.fileAccessWhere(access);
    const [deals, products, tasks, invoices, projectFileCount, allProjectLinkedCount] =
      await Promise.all([
        this.prisma.deal.findMany({
          where: { projectId },
          select: { id: true, code: true, name: true },
          orderBy: { code: 'asc' },
        }),
        this.prisma.product.findMany({
          where: { projectId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        this.loadProjectTasks(projectId),
        this.prisma.invoice.findMany({
          where: { projectId },
          select: { id: true, code: true },
          orderBy: { code: 'asc' },
        }),
        this.countProjectLevelFiles(projectId, accessWhere),
        this.countLinkedFiles('PROJECT', projectId, accessWhere),
      ]);

    const [dealCounts, productCounts, taskCounts, invoiceCounts] = await Promise.all([
      this.countByEntityIds(
        'DEAL',
        deals.map((d) => d.id),
        accessWhere,
      ),
      this.countByEntityIds(
        'PRODUCT',
        products.map((p) => p.id),
        accessWhere,
      ),
      this.countByEntityIds(
        'TASK',
        tasks.map((t) => t.id),
        accessWhere,
      ),
      this.countByEntityIds(
        'INVOICE',
        invoices.map((i) => i.id),
        accessWhere,
      ),
    ]);

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      projectFileCount,
      allProjectLinkedCount,
      deals: deals.map((d) => hubRow(d.id, d.name?.trim() || d.code, dealCounts.get(d.id) ?? 0)),
      products: products.map((p) => hubRow(p.id, p.name, productCounts.get(p.id) ?? 0)),
      tasks: tasks.map((t) => hubRow(t.id, `${t.code} · ${t.title}`, taskCounts.get(t.id) ?? 0)),
      invoices: invoices.map((i) => hubRow(i.id, i.code, invoiceCounts.get(i.id) ?? 0)),
    };
  }

  async buildProjectLevelWhere(projectId: string): Promise<Prisma.FileAssetWhereInput> {
    return {
      AND: [
        {
          links: {
            some: { entityType: PROJECT_SCOPE, entityId: projectId, unlinkedAt: null },
          },
        },
        {
          NOT: {
            links: {
              some: { entityType: { not: PROJECT_SCOPE }, unlinkedAt: null },
            },
          },
        },
      ],
    };
  }

  private async fileAccessWhere(access?: DriveEntityAccess): Promise<Prisma.FileAssetWhereInput> {
    return { deletedAt: null, ...(await buildDriveAssetAccessWhere(this.prisma, access)) };
  }

  private async countProjectLevelFiles(
    projectId: string,
    accessWhere: Prisma.FileAssetWhereInput,
  ): Promise<number> {
    return this.prisma.fileAsset.count({
      where: { AND: [accessWhere, await this.buildProjectLevelWhere(projectId)] },
    });
  }

  private async countLinkedFiles(
    entityType: string,
    entityId: string,
    accessWhere: Prisma.FileAssetWhereInput,
  ): Promise<number> {
    return this.prisma.fileAsset.count({
      where: {
        AND: [accessWhere, { links: { some: { entityType, entityId, unlinkedAt: null } } }],
      },
    });
  }

  private async countByEntityIds(
    entityType: string,
    entityIds: string[],
    accessWhere: Prisma.FileAssetWhereInput,
  ): Promise<Map<string, number>> {
    if (entityIds.length === 0) return new Map();
    const groups = await this.prisma.fileLink.groupBy({
      by: ['entityId'],
      where: {
        entityType,
        entityId: { in: entityIds },
        unlinkedAt: null,
        fileAsset: accessWhere,
      },
      _count: { _all: true },
    });
    return new Map(groups.map((g) => [g.entityId, g._count._all]));
  }

  private async loadProjectTasks(projectId: string) {
    return this.prisma.task.findMany({
      where: {
        OR: [{ product: { projectId } }, { workspace: { projectId } }],
      },
      select: { id: true, code: true, title: true },
      orderBy: { code: 'asc' },
      take: 200,
    });
  }
}

function hubRow(id: string, label: string, fileCount: number): ProjectHubEntityRow {
  return { id, label, fileCount };
}
