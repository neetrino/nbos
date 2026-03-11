import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ExtensionSize,
  type ExtensionStatus,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

const STATUS_TRANSITIONS: Record<ExtensionStatus, ExtensionStatus[]> = {
  NEW: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['REVIEW', 'CANCELLED'],
  REVIEW: ['DONE', 'IN_PROGRESS'],
  DONE: [],
  CANCELLED: ['NEW'],
};

interface CreateExtensionDto {
  projectId: string;
  productId?: string;
  name: string;
  size?: string;
  assignedTo?: string;
}

interface UpdateExtensionDto {
  name?: string;
  productId?: string;
  size?: string;
  assignedTo?: string;
}

interface ExtensionQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  status?: string;
  size?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const EXTENSION_LIST_INCLUDE = {
  project: { select: { id: true, name: true, code: true } },
  product: { select: { id: true, name: true, productType: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ExtensionInclude;

const EXTENSION_DETAIL_INCLUDE = {
  project: { select: { id: true, name: true, code: true } },
  product: { select: { id: true, name: true, productType: true, status: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  tasks: { select: { id: true, title: true, status: true } },
} satisfies Prisma.ExtensionInclude;

@Injectable()
export class ExtensionsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ExtensionQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      productId,
      status,
      size,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhereClause({ projectId, productId, status, size, search });

    const [items, total] = await Promise.all([
      this.prisma.extension.findMany({
        where,
        include: EXTENSION_LIST_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.extension.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const extension = await this.prisma.extension.findUnique({
      where: { id },
      include: EXTENSION_DETAIL_INCLUDE,
    });
    if (!extension) throw new NotFoundException(`Extension ${id} not found`);
    return extension;
  }

  async create(data: CreateExtensionDto) {
    return this.prisma.extension.create({
      data: {
        projectId: data.projectId,
        productId: data.productId,
        name: data.name,
        size: (data.size as ExtensionSize) ?? 'SMALL',
        assignedTo: data.assignedTo,
      },
      include: EXTENSION_LIST_INCLUDE,
    });
  }

  async update(id: string, data: UpdateExtensionDto) {
    await this.findById(id);
    return this.prisma.extension.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.productId !== undefined && { productId: data.productId || null }),
        ...(data.size && { size: data.size as ExtensionSize }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo || null }),
      },
      include: EXTENSION_LIST_INCLUDE,
    });
  }

  async updateStatus(id: string, status: string) {
    const extension = await this.findById(id);
    const current = extension.status as ExtensionStatus;
    const target = status as ExtensionStatus;

    const allowed = STATUS_TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
      );
    }

    return this.prisma.extension.update({
      where: { id },
      data: { status: target },
      include: EXTENSION_LIST_INCLUDE,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.extension.delete({ where: { id } });
  }

  private buildWhereClause(filters: {
    projectId?: string;
    productId?: string;
    status?: string;
    size?: string;
    search?: string;
  }): Prisma.ExtensionWhereInput {
    const where: Prisma.ExtensionWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status as ExtensionStatus;
    if (filters.size) where.size = filters.size as ExtensionSize;
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    return where;
  }
}
