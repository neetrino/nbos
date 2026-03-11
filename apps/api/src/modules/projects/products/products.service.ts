import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ProductTypeEnum,
  type ProductStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

const STATUS_TRANSITIONS: Record<ProductStatusEnum, ProductStatusEnum[]> = {
  NEW: ['CREATING', 'LOST'],
  CREATING: ['DEVELOPMENT', 'ON_HOLD', 'LOST'],
  DEVELOPMENT: ['QA', 'ON_HOLD', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'ON_HOLD'],
  TRANSFER: ['DONE', 'QA'],
  ON_HOLD: ['CREATING', 'DEVELOPMENT', 'QA', 'LOST'],
  DONE: [],
  LOST: ['NEW'],
};

interface CreateProductDto {
  projectId: string;
  name: string;
  productType: string;
  pmId?: string;
  deadline?: string;
  checklistTemplateId?: string;
}

interface UpdateProductDto {
  name?: string;
  productType?: string;
  pmId?: string;
  deadline?: string;
  checklistTemplateId?: string;
}

interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  productType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const PRODUCT_LIST_INCLUDE = {
  project: { select: { id: true, name: true, code: true } },
  pm: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { extensions: true, tasks: true } },
} satisfies Prisma.ProductInclude;

const PRODUCT_DETAIL_INCLUDE = {
  project: { select: { id: true, name: true, code: true } },
  pm: { select: { id: true, firstName: true, lastName: true } },
  extensions: { select: { id: true, name: true, status: true, size: true } },
  tasks: { select: { id: true, title: true, status: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ProductQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      status,
      productType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhereClause({ projectId, status, productType, search });

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_DETAIL_INCLUDE,
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        productType: data.productType as ProductTypeEnum,
        pmId: data.pmId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        checklistTemplateId: data.checklistTemplateId,
      },
      include: PRODUCT_LIST_INCLUDE,
    });
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.productType && { productType: data.productType as ProductTypeEnum }),
        ...(data.pmId !== undefined && { pmId: data.pmId || null }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.checklistTemplateId !== undefined && {
          checklistTemplateId: data.checklistTemplateId || null,
        }),
      },
      include: PRODUCT_LIST_INCLUDE,
    });
  }

  async updateStatus(id: string, status: string) {
    const product = await this.findById(id);
    const current = product.status as ProductStatusEnum;
    const target = status as ProductStatusEnum;

    const allowed = STATUS_TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${target}. Allowed: ${allowed?.join(', ') || 'none'}`,
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: target },
      include: PRODUCT_LIST_INCLUDE,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  private buildWhereClause(filters: {
    projectId?: string;
    status?: string;
    productType?: string;
    search?: string;
  }): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status as ProductStatusEnum;
    if (filters.productType) where.productType = filters.productType as ProductTypeEnum;
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    return where;
  }
}
