import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ExtensionSizeEnum,
  type ExtensionStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

const ALLOWED_TRANSITIONS: Record<ExtensionStatusEnum, ExtensionStatusEnum[]> = {
  NEW: ['DEVELOPMENT', 'LOST'],
  DEVELOPMENT: ['QA', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'LOST'],
  TRANSFER: ['DONE', 'LOST'],
  DONE: [],
  LOST: [],
};

interface CreateExtensionDto {
  projectId: string;
  productId?: string;
  name: string;
  size?: string;
  assignedTo?: string;
  description?: string;
}

interface UpdateExtensionDto {
  name?: string;
  productId?: string | null;
  size?: string;
  assignedTo?: string | null;
  description?: string | null;
}

interface ExtensionQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  status?: string;
  size?: string;
  assignedTo?: string;
  search?: string;
}

@Injectable()
export class ExtensionsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async findAll(params: ExtensionQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      productId,
      status,
      size,
      assignedTo,
      search,
    } = params;
    const where: Prisma.ExtensionWhereInput = {};

    if (projectId) where.projectId = projectId;
    if (productId) where.productId = productId;
    if (status) where.status = status as ExtensionStatusEnum;
    if (size) where.size = size as ExtensionSizeEnum;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.extension.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          product: { select: { id: true, name: true, productType: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          order: { select: { id: true, code: true, status: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
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
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true, status: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: {
          include: {
            invoices: {
              select: { id: true, code: true, status: true, amount: true, dueDate: true },
            },
          },
        },
        tasks: {
          select: { id: true, code: true, title: true, status: true, priority: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
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
        size: (data.size as ExtensionSizeEnum) ?? 'SMALL',
        assignedTo: data.assignedTo,
        description: data.description,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateExtensionDto) {
    await this.findById(id);
    return this.prisma.extension.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.productId !== undefined && { productId: data.productId }),
        ...(data.size !== undefined && { size: data.size as ExtensionSizeEnum }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, newStatus: string) {
    const extension = await this.findById(id);
    const current = extension.status as ExtensionStatusEnum;
    const target = newStatus as ExtensionStatusEnum;

    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
      );
    }

    return this.prisma.extension.update({
      where: { id },
      data: { status: target },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.extension.delete({ where: { id } });
  }

  async getStats(projectId?: string) {
    const where: Prisma.ExtensionWhereInput = {};
    if (projectId) where.projectId = projectId;

    const [total, byStatus, bySize] = await Promise.all([
      this.prisma.extension.count({ where }),
      this.prisma.extension.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.extension.groupBy({ by: ['size'], where, _count: true }),
    ]);

    return { total, byStatus, bySize };
  }
}
