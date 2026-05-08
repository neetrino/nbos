import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ProductCategoryEnum,
  type ProductTypeEnum,
  type ProductStatusEnum,
  type DeliveryResolutionEnum,
  type DeliveryStageEnum,
  type DeliveryWorkStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { NotificationService } from '../../notifications/notification.service';
import {
  PRODUCT_STATUS_ORDER,
  validateKickoffChecklistGate,
  validateProductStageGate,
  validateProductTransition,
} from './product-stage-gates';
import { PROJECT_KICKOFF_CHECKLIST_ITEMS } from '../project-kickoff-checklist.constants';
import {
  attachProductDeliveryLifecycle,
  buildDeliveryLifecycleWrite,
  buildDeliveryPauseWrite,
  buildDeliveryResumeWrite,
  productLegacyStatusForStage,
  requireDeliveryStage,
} from '../delivery-lifecycle';
import { batchProductOpenCounts } from './batch-product-open-counts';
import { buildProductCurrentStageReadiness } from './product-current-stage-readiness';
import { buildProductDoneReadiness } from './product-done-readiness';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';
import { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';

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

interface PauseDeliveryDto {
  reason: string;
  onHoldUntil: string;
}

interface CancelDeliveryDto {
  reason: string;
}

interface MoveStageDto {
  stage: string;
}

interface ConfirmAcceptanceDto {
  acceptedBy?: string;
  note?: string;
}

interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  /** Filter by project's billing company (CRM). */
  companyId?: string;
  status?: string;
  deliveryStage?: string;
  deliveryWorkStatus?: string;
  deliveryResolution?: string;
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
    private readonly notifications: NotificationService,
    private readonly partnerAccrualClassic: PartnerAccrualClassicService,
  ) {}

  async findAll(params: ProductQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      companyId,
      status,
      deliveryStage,
      deliveryWorkStatus,
      deliveryResolution,
      productCategory,
      productType,
      pmId,
      search,
    } = params;
    const where: Prisma.ProductWhereInput = {};

    if (projectId) where.projectId = projectId;
    if (companyId) {
      where.project = { is: { companyId } };
    }
    if (status) where.status = status as ProductStatusEnum;
    if (deliveryStage) where.deliveryStage = deliveryStage as DeliveryStageEnum;
    if (deliveryWorkStatus) {
      where.deliveryWorkStatus = deliveryWorkStatus as DeliveryWorkStatusEnum;
    }
    if (deliveryResolution) {
      where.deliveryResolution = deliveryResolution as DeliveryResolutionEnum;
    }
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
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              companyId: true,
              company: { select: { id: true, name: true } },
            },
          },
          pm: { select: { id: true, firstName: true, lastName: true } },
          order: {
            select: {
              id: true,
              code: true,
              status: true,
              invoices: { select: { moneyStatus: true } },
            },
          },
          _count: { select: { extensions: true, tasks: true, tickets: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    const openByProduct = await batchProductOpenCounts(
      this.prisma,
      items.map((p) => p.id),
    );

    return {
      items: items.map((product) => {
        const withLc = attachProductDeliveryLifecycle(product);
        const open = openByProduct.get(product.id) ?? {
          openTasks: 0,
          openTickets: 0,
          openExtensions: 0,
        };
        const readiness = buildProductCurrentStageReadiness(
          product,
          withLc.deliveryLifecycle,
          open,
        );
        return {
          ...withLc,
          deliveryLifecycle: {
            ...withLc.deliveryLifecycle,
            ...(readiness ? { currentStageReadiness: readiness } : {}),
          },
        };
      }),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            credentials: {
              where: { archivedAt: null },
              select: { category: true },
            },
            domains: { select: { status: true } },
            _count: {
              select: {
                credentials: { where: { archivedAt: null } },
                domains: true,
              },
            },
          },
        },
        pm: { select: { id: true, firstName: true, lastName: true, email: true } },
        order: {
          include: {
            deal: {
              select: {
                offerFileUrl: true,
                contractFileUrl: true,
              },
            },
            invoices: {
              select: { id: true, code: true, moneyStatus: true, amount: true, dueDate: true },
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
    return {
      ...attachProductDeliveryLifecycle(product),
      doneReadiness: buildProductDoneReadiness(product),
    };
  }

  async create(data: CreateProductDto) {
    const product = await this.prisma.product.create({
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
    return attachProductDeliveryLifecycle(product);
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findById(id);
    const product = await this.prisma.product.update({
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
    return attachProductDeliveryLifecycle(product);
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

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, product) },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async moveStage(id: string, data: MoveStageDto) {
    const product = await this.findById(id);
    this.ensureActiveForStageMove(product.deliveryLifecycle);
    const stage = this.parseDeliveryStage(data.stage);
    const target = productLegacyStatusForStage(stage) as ProductStatusEnum;

    validateProductTransition(product.status as ProductStatusEnum, target);
    validateProductStageGate(product, target);
    if (target === 'DEVELOPMENT') await this.validateDevelopmentGate(product.projectId);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, product) },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async pause(id: string, data: PauseDeliveryDto) {
    const product = await this.findById(id);
    this.ensureNotTerminal(product.deliveryLifecycle.resolution);
    const reason = requireText(data.reason, 'reason');
    const onHoldUntil = parseFutureDate(data.onHoldUntil, 'onHoldUntil');
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: 'ON_HOLD',
        ...buildDeliveryPauseWrite(product, reason, onHoldUntil),
      },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async resume(id: string) {
    const product = await this.findById(id);
    this.ensureNotTerminal(product.deliveryLifecycle.resolution);
    if (product.deliveryLifecycle.workStatus !== 'ON_HOLD') {
      throw new BadRequestException('Product is not on hold');
    }
    const nextStatus = productLegacyStatusForStage(product.deliveryLifecycle.stage);
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { status: nextStatus as ProductStatusEnum, ...buildDeliveryResumeWrite(product) },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async cancel(id: string, data: CancelDeliveryDto) {
    const product = await this.findById(id);
    this.ensureNotTerminal(product.deliveryLifecycle.resolution);
    const reason = requireText(data.reason, 'reason');
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: 'LOST',
        ...buildDeliveryLifecycleWrite('LOST', product),
        cancellationReason: reason,
      },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async complete(id: string) {
    const product = await this.findById(id);
    this.ensureActiveForStageMove(product.deliveryLifecycle);
    const target = 'DONE' as ProductStatusEnum;

    validateProductTransition(product.status as ProductStatusEnum, target);
    validateProductStageGate(product, target);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, product) },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    const linkedOrder = await this.prisma.order.findUnique({
      where: { productId: id },
      select: { id: true },
    });
    if (linkedOrder) {
      await syncProductBonusPoolForOrder(this.prisma, linkedOrder.id, this.notifications);
      await this.partnerAccrualClassic.tryInboundClassicAfterDelivery(linkedOrder.id);
    }
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async confirmAcceptance(id: string, data: ConfirmAcceptanceDto) {
    const product = await this.findById(id);
    this.ensureNotTerminal(product.deliveryLifecycle.resolution);
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        clientAcceptedAt: new Date(),
        clientAcceptedBy: data.acceptedBy?.trim() || null,
        clientAcceptanceNote: data.note?.trim() || null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
    return attachProductDeliveryLifecycle(updatedProduct);
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

  private ensureNotTerminal(resolution: string | null) {
    if (resolution) {
      throw new BadRequestException('Terminal delivery item cannot be changed');
    }
  }

  private ensureActiveForStageMove(lifecycle: { resolution: string | null; workStatus: string }) {
    this.ensureNotTerminal(lifecycle.resolution);
    if (lifecycle.workStatus === 'ON_HOLD') {
      throw new BadRequestException('Paused product must be resumed before stage movement');
    }
  }

  private parseDeliveryStage(stage: string) {
    try {
      return requireDeliveryStage(stage);
    } catch {
      throw new BadRequestException(`Invalid delivery stage: ${stage}`);
    }
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

function requireText(value: string | undefined, field: string) {
  const text = value?.trim();
  if (!text) throw new BadRequestException(`${field} is required`);
  return text;
}

function parseFutureDate(value: string | undefined, field: string) {
  const raw = requireText(value, field);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} is invalid`);
  return date;
}
