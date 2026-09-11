import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { allocateProjectCode } from '../../common/utils/entity-code-series';
import { permanentlyDeleteProfileATrashedEntity } from '../../common/lifecycle/profile-a-permanent-delete.ops';
import { projectDetailInclude } from './project.includes';
import { buildProjectIntake } from './project-intake';
import {
  attachExtensionDeliveryLifecycle,
  attachProductDeliveryLifecycle,
  type DeliveryStatusCarrier,
} from './delivery-lifecycle';
import {
  overlayProductWorkWhatsAppList,
  type ProductWhatsAppListFields,
} from './product-whatsapp-list-overlay';
import { resolveWhatsAppAccountantGroupChatId } from '../messenger/core/product-communication-account';
import { syncEntityContactLinks } from '../crm/shared/sync-entity-contact-links.ops';
import { clearProductMembershipsForRemovedProjectContacts } from './products/product-contacts.ops';
import { resolveSortField, normalizeSortDirection } from '../../common/utils/sort-order';
import {
  assertEntityIsActive,
  assertEntityIsTrashed,
} from '../../common/lifecycle/entity-lifecycle-guards';
import { mergeProfileAListScope } from '../../common/lifecycle/entity-lifecycle-scope';
import { PROJECT_LIST_INCLUDE, toProjectListItem } from './project-list-item';
import { buildProjectListWhere, type ProjectListQueryParams } from './project-list-where';

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
  contactIds?: string[];
}

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: ProjectListQueryParams) {
    const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const where = buildProjectListWhere(params);

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: PROJECT_LIST_INCLUDE,
        orderBy: [
          {
            [resolveSortField(sortBy, PROJECT_SORT_FIELDS, 'createdAt')]:
              normalizeSortDirection(sortOrder),
          },
          { id: normalizeSortDirection(sortOrder) },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map(toProjectListItem),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const [project, accountant] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id },
        include: projectDetailInclude,
      }),
      resolveWhatsAppAccountantGroupChatId(this.prisma),
    ]);
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    const deliveryProject = attachProjectDeliveryLifecycles(project, accountant);
    return { ...deliveryProject, intake: buildProjectIntake(deliveryProject) };
  }

  async create(data: CreateProjectDto) {
    const code = await allocateProjectCode(this.prisma);
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

    assertEntityIsActive(existing, 'trashedAt', 'Project');

    let resolvedContactId = data.contactId ?? existing.contactId;

    if (data.contactIds !== undefined) {
      const { primaryContactId } = await syncEntityContactLinks(
        this.prisma,
        'project',
        id,
        data.contactIds,
      );
      resolvedContactId = primaryContactId ?? existing.contactId;
      const remaining = new Set(data.contactIds.filter(Boolean));
      if (resolvedContactId) remaining.add(resolvedContactId);
      await clearProductMembershipsForRemovedProjectContacts(this.prisma, id, remaining);
    }

    await this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.companyId !== undefined && { companyId: data.companyId || null }),
        ...(data.contactIds !== undefined || data.contactId !== undefined
          ? { contactId: resolvedContactId }
          : {}),
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
      data: { trashedAt: new Date() },
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
      data: { trashedAt: null },
    });
  }

  async permanentlyDeleteFromTrash(id: string, userId: string) {
    await permanentlyDeleteProfileATrashedEntity(this.prisma, this.auditService, {
      key: 'project',
      id,
      userId,
    });
  }

  async getStats() {
    const activeWhere = mergeProfileAListScope({}, 'active');
    const total = await this.prisma.project.count({ where: activeWhere });
    return { total };
  }
}

function attachProjectDeliveryLifecycles<
  T extends {
    products?: Array<DeliveryStatusCarrier & ProductWhatsAppListFields>;
    extensions?: Array<DeliveryStatusCarrier>;
  },
>(project: T, accountantGroupChatId: string | null) {
  return {
    ...project,
    products: project.products?.map((product) =>
      overlayProductWorkWhatsAppList(
        attachProductDeliveryLifecycle(product),
        accountantGroupChatId,
      ),
    ),
    extensions: project.extensions?.map((extension) => attachExtensionDeliveryLifecycle(extension)),
  };
}
