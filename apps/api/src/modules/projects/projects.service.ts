import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import type { EntityLifecycleScope } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { projectDetailInclude } from './project.includes';
import { buildProjectIntake } from './project-intake';
import {
  attachExtensionDeliveryLifecycle,
  attachProductDeliveryLifecycle,
  type DeliveryStatusCarrier,
} from './delivery-lifecycle';
import { syncEntityContactLinks } from '../crm/shared/sync-entity-contact-links.ops';
import { resolveSortField, normalizeSortDirection } from '../../common/utils/sort-order';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../common/lifecycle/entity-lifecycle-guards';
import {
  mergeProfileAListScope,
  parseLifecycleScopeFromQuery,
} from '../../common/lifecycle/entity-lifecycle-scope';

const PROJECT_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'name', 'code']);

interface CreateProjectDto {
  name: string;
  contactId: string;
  description?: string;
  companyId?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string;
  companyId?: string | null;
  contactId?: string;
  /** @deprecated Use trash/restore endpoints — kept for transitional sync. */
  isArchived?: boolean;
  contactIds?: string[];
}

interface ProjectQueryParams {
  page?: number;
  pageSize?: number;
  /** @deprecated Use `scope` — maps true→trash, false→active. */
  isArchived?: boolean;
  scope?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function resolveProjectListScope(params: ProjectQueryParams): EntityLifecycleScope | null {
  if (params.scope != null && params.scope.trim() !== '') {
    return parseLifecycleScopeFromQuery(params.scope);
  }
  if (params.isArchived === true) return 'trash';
  if (params.isArchived === false) return 'active';
  return null;
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ProjectQueryParams) {
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const lifecycleScope = resolveProjectListScope(params);
    const where: Prisma.ProjectWhereInput =
      lifecycleScope != null ? mergeProfileAListScope({}, lifecycleScope) : {};

    if (search) {
      const q = search.trim();
      if (q.length > 0) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
          { contact: { firstName: { contains: q, mode: 'insensitive' } } },
          { contact: { lastName: { contains: q, mode: 'insensitive' } } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { orders: true } },
        },
        orderBy: {
          [resolveSortField(sortBy, PROJECT_SORT_FIELDS, 'createdAt')]:
            normalizeSortDirection(sortOrder),
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectDetailInclude,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    const deliveryProject = attachProjectDeliveryLifecycles(project);
    return { ...deliveryProject, intake: buildProjectIntake(deliveryProject) };
  }

  async create(data: CreateProjectDto) {
    const code = await this.generateCode();
    return this.prisma.project.create({
      data: {
        code,
        name: data.name,
        contactId: data.contactId,
        description: data.description,
        companyId: data.companyId,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      select: { contactId: true, trashedAt: true },
    });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const isTrashOnlyUpdate =
      data.isArchived !== undefined &&
      data.name === undefined &&
      data.description === undefined &&
      data.companyId === undefined &&
      data.contactId === undefined &&
      data.contactIds === undefined;

    if (!isTrashOnlyUpdate) {
      assertEntityIsActive(existing, 'trashedAt', 'Project');
    }

    let resolvedContactId = data.contactId ?? existing.contactId;

    if (data.contactIds !== undefined) {
      const { primaryContactId } = await syncEntityContactLinks(
        this.prisma,
        'project',
        id,
        data.contactIds,
      );
      resolvedContactId = primaryContactId ?? existing.contactId;
    }

    const trashSync =
      data.isArchived === undefined
        ? {}
        : data.isArchived
          ? { trashedAt: new Date(), isArchived: true }
          : { trashedAt: null, isArchived: false };

    await this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.companyId !== undefined && { companyId: data.companyId || null }),
        ...(data.contactIds !== undefined || data.contactId !== undefined
          ? { contactId: resolvedContactId }
          : {}),
        ...trashSync,
      },
    });

    return this.findById(id);
  }

  async moveToTrash(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    assertEntityIsActive(project, 'trashedAt', 'Project');
    return this.prisma.project.update({
      where: { id },
      data: { trashedAt: new Date(), isArchived: true },
    });
  }

  async restoreFromTrash(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true, trashedAt: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    assertEntityIsTrashed(project, 'trashedAt', 'Project');
    return this.prisma.project.update({
      where: { id },
      data: { trashedAt: null, isArchived: false },
    });
  }

  /** @deprecated Use moveToTrash — kept for transitional callers. */
  async delete(id: string) {
    return this.moveToTrash(id);
  }

  async getStats() {
    const activeWhere = mergeProfileAListScope({}, 'active');
    const total = await this.prisma.project.count({ where: activeWhere });
    return { total };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.project.findFirst({
      where: { code: { startsWith: `P-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `P-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}

function attachProjectDeliveryLifecycles<
  T extends { products?: Array<DeliveryStatusCarrier>; extensions?: Array<DeliveryStatusCarrier> },
>(project: T) {
  return {
    ...project,
    products: project.products?.map((product) => attachProductDeliveryLifecycle(product)),
    extensions: project.extensions?.map((extension) => attachExtensionDeliveryLifecycle(extension)),
  };
}
