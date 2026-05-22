import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { projectDetailInclude } from './project.includes';
import { buildProjectIntake } from './project-intake';
import {
  attachExtensionDeliveryLifecycle,
  attachProductDeliveryLifecycle,
  type DeliveryStatusCarrier,
} from './delivery-lifecycle';
import { syncProjectAdditionalContacts } from './project-additional-contacts.ops';

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
  isArchived?: boolean;
  additionalContactIds?: string[];
}

interface ProjectQueryParams {
  page?: number;
  pageSize?: number;
  isArchived?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ProjectQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      isArchived,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ProjectWhereInput = {};
    if (isArchived !== undefined) where.isArchived = isArchived;
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
        orderBy: { [sortBy]: sortOrder },
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
      select: { contactId: true },
    });
    if (!existing) throw new NotFoundException(`Project ${id} not found`);

    const nextContactId = data.contactId ?? existing.contactId;

    await this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.companyId !== undefined && { companyId: data.companyId || null }),
        ...(data.contactId !== undefined && { contactId: data.contactId }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      },
    });

    if (data.additionalContactIds !== undefined) {
      await syncProjectAdditionalContacts(
        this.prisma,
        id,
        data.additionalContactIds,
        nextContactId,
      );
    }

    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async getStats() {
    const total = await this.prisma.project.count();
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
