import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { DriveEntityAccess } from './drive.service';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import type {
  ProjectDriveHubSummary,
  ProjectHubClientRow,
  ProjectHubEntityRow,
  ProjectHubProductRow,
} from './drive-project-hub.types';

const PROJECT_SCOPE = 'PROJECT';

@Injectable()
export class DriveProjectHubService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getSummary(projectId: string, access?: DriveEntityAccess): Promise<ProjectDriveHubSummary> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId },
      select: {
        id: true,
        code: true,
        name: true,
        contactId: true,
        companyId: true,
        contact: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
      },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const accessWhere = await this.fileAccessWhere(access);
    const [deals, productsRaw, tasks, invoices] = await Promise.all([
      this.prisma.deal.findMany({
        where: { projectId },
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          extensions: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        },
        orderBy: { name: 'asc' },
      }),
      this.loadProjectTasks(projectId),
      this.prisma.invoice.findMany({
        where: { projectId },
        select: { id: true, code: true },
        orderBy: { code: 'asc' },
      }),
    ]);

    const extensionIds = productsRaw.flatMap((p) => p.extensions.map((e) => e.id));
    const [dealCounts, productCounts, extensionCounts, taskCounts, invoiceCounts, clientCounts] =
      await Promise.all([
        this.countByEntityIds(
          'DEAL',
          deals.map((d) => d.id),
          accessWhere,
        ),
        this.countByEntityIds(
          'PRODUCT',
          productsRaw.map((p) => p.id),
          accessWhere,
        ),
        this.countByEntityIds('EXTENSION', extensionIds, accessWhere),
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
        this.loadClientCounts(project, accessWhere),
      ]);

    const products: ProjectHubProductRow[] = productsRaw.map((p) =>
      hubProductRow(
        p.id,
        p.name,
        productCounts.get(p.id) ?? 0,
        p.extensions.map((e) => hubRow(e.id, e.name, extensionCounts.get(e.id) ?? 0)),
      ),
    );

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      deals: deals.map((d) => hubRow(d.id, d.name?.trim() || d.code, dealCounts.get(d.id) ?? 0)),
      products,
      client: buildClientRows(project, clientCounts),
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

  private async loadClientCounts(
    project: {
      companyId: string | null;
      contactId: string;
    },
    accessWhere: Prisma.FileAssetWhereInput,
  ): Promise<Map<string, number>> {
    const ids: { id: string; entityType: 'COMPANY' | 'CONTACT' }[] = [];
    if (project.companyId) ids.push({ id: project.companyId, entityType: 'COMPANY' });
    ids.push({ id: project.contactId, entityType: 'CONTACT' });
    const maps = await Promise.all(
      ids.map(async (row) => {
        const counts = await this.countByEntityIds(row.entityType, [row.id], accessWhere);
        return [row.id, counts.get(row.id) ?? 0] as const;
      }),
    );
    return new Map(maps);
  }

  private async fileAccessWhere(access?: DriveEntityAccess): Promise<Prisma.FileAssetWhereInput> {
    return { deletedAt: null, ...(await buildDriveAssetAccessWhere(this.prisma, access)) };
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

function buildClientRows(
  project: {
    companyId: string | null;
    contactId: string;
    contact: { firstName: string; lastName: string | null };
    company: { name: string } | null;
  },
  counts: Map<string, number>,
): ProjectHubClientRow[] {
  const rows: ProjectHubClientRow[] = [];
  if (project.companyId && project.company) {
    rows.push({
      id: project.companyId,
      entityType: 'COMPANY',
      label: project.company.name,
      fileCount: counts.get(project.companyId) ?? 0,
    });
  }
  const contactLabel =
    [project.contact.firstName, project.contact.lastName].filter(Boolean).join(' ') || 'Contact';
  rows.push({
    id: project.contactId,
    entityType: 'CONTACT',
    label: contactLabel,
    fileCount: counts.get(project.contactId) ?? 0,
  });
  return rows;
}

function hubRow(id: string, label: string, fileCount: number): ProjectHubEntityRow {
  return { id, label, fileCount };
}

function hubProductRow(
  id: string,
  label: string,
  fileCount: number,
  extensions: ProjectHubEntityRow[],
): ProjectHubProductRow {
  return { id, label, fileCount, extensions };
}
