import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ProductCategoryEnum,
  type ProductTypeEnum,
  type ProductStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  PRODUCT_STATUS_ORDER,
  validateKickoffChecklistGate,
  validateProductStageGate,
  validateProductTransition,
} from './product-stage-gates';
import { PROJECT_KICKOFF_CHECKLIST_ITEMS } from '../project-kickoff-checklist.constants';

interface CreateProductDto {
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  pmId?: string;
  deadline?: string;
  description?: string;
  checklistTemplateId?: string;
}

interface UpdateProductDto {
  name?: string;
  productCategory?: string;
  productType?: string;
  pmId?: string | null;
  deadline?: string | null;
  description?: string | null;
  checklistTemplateId?: string | null;
}

interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  productCategory?: string;
  productType?: string;
  pmId?: string;
  search?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async findAll(params: ProductQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      status,
      productCategory,
      productType,
      pmId,
      search,
    } = params;
    const where: Prisma.ProductWhereInput = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status as ProductStatusEnum;
    if (productCategory) where.productCategory = productCategory as ProductCategoryEnum;
    if (productType) where.productType = productType as ProductTypeEnum;
    if (pmId) where.pmId = pmId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          pm: { select: { id: true, firstName: true, lastName: true } },
          order: { select: { id: true, code: true, status: true } },
          _count: { select: { extensions: true, tasks: true, tickets: true } },
        },
        orderBy: { createdAt: 'desc' },
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
      include: {
        project: { select: { id: true, code: true, name: true } },
        pm: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: {
          include: {
            invoices: {
              select: { id: true, code: true, status: true, amount: true, dueDate: true },
            },
          },
        },
        extensions: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          select: { id: true, code: true, title: true, status: true, priority: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        tickets: {
          select: { id: true, code: true, title: true, status: true, priority: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        productCategory: data.productCategory as ProductCategoryEnum,
        productType: data.productType as ProductTypeEnum,
        pmId: data.pmId,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        description: data.description,
        checklistTemplateId: data.checklistTemplateId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        pm: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.productCategory !== undefined && {
          productCategory: data.productCategory as ProductCategoryEnum,
        }),
        ...(data.productType !== undefined && {
          productType: data.productType as ProductTypeEnum,
        }),
        ...(data.pmId !== undefined && { pmId: data.pmId }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.checklistTemplateId !== undefined && {
          checklistTemplateId: data.checklistTemplateId,
        }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        pm: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, newStatus: string) {
    const product = await this.findById(id);
    const current = product.status as ProductStatusEnum;
    const target = newStatus as ProductStatusEnum;

    if (!PRODUCT_STATUS_ORDER.includes(target)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    validateProductTransition(current, target);
    validateProductStageGate(product, target);
    if (target === 'DEVELOPMENT') await this.validateDevelopmentGate(product.projectId);

    return this.prisma.product.update({
      where: { id },
      data: { status: target },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async getStats(projectId?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (projectId) where.projectId = projectId;

    const [total, byStatus, byType] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.product.groupBy({ by: ['productType'], where, _count: true }),
    ]);

    return { total, byStatus, byType };
  }

  private async validateDevelopmentGate(projectId: string) {
    const checklist = await this.prisma.projectKickoffChecklistItem.findMany({
      where: { projectId, isRequired: true },
      select: { key: true, title: true, isRequired: true, isChecked: true },
      orderBy: { sortOrder: 'asc' },
    });
    validateKickoffChecklistGate(checklist.length > 0 ? checklist : getMissingKickoffChecklist());
  }
}

function getMissingKickoffChecklist() {
  return PROJECT_KICKOFF_CHECKLIST_ITEMS.filter((item) => item.isRequired).map((item) => ({
    key: item.key,
    title: item.title,
    isRequired: item.isRequired,
    isChecked: false,
  }));
}
