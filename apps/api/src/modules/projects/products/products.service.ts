import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ProductCategoryEnum,
  type ProductTypeEnum,
  type ProductStatusEnum,
  type DeliveryResolutionEnum,
  type DeliveryStageEnum,
  type DeliveryWorkStatusEnum,
  type InputJsonValue,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { NotificationService } from '../../notifications/notification.service';
import {
  PRODUCT_STATUS_ORDER,
  validateProductStageGate,
  validateProductTransition,
} from './product-stage-gates';
import {
  attachProductDeliveryLifecycle,
  buildDeliveryLifecycleWrite,
  buildDeliveryPauseWrite,
  buildDeliveryResumeWrite,
  productLegacyStatusForStage,
  requireDeliveryStage,
} from '../delivery-lifecycle';
import { mergeActiveParentProjectScope } from '../active-project-list-scope';
import { batchProductOpenCounts } from './batch-product-open-counts';
import { buildProductCurrentStageReadiness } from './product-current-stage-readiness';
import { buildProductDoneReadiness } from './product-done-readiness';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';
import { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import { AuditService } from '../../audit/audit.service';
import {
  DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
  isLegacyPatchStatusTerminalOutcome,
} from '../delivery-status-deprecation';
import {
  loadStageChecklistProgressByOwner,
  pickProgressForEntity,
} from '../../checklist-templates/checklist-instance-stage-progress';
import { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import { ProductTeamSyncService } from '../../platform-access/product-team-sync.service';

interface CreateProductDto {
  projectId: string;
  name: string;
  productCategory: string;
  productType: string;
  pmId?: string;
  deadline?: string;
  description?: string;
  checklistTemplateId?: string;
  languages?: string[];
}

interface UpdateProductDto {
  name?: string;
  productCategory?: string;
  productType?: string;
  pmId?: string | null;
  developerId?: string | null;
  designerId?: string | null;
  technicalSpecialistId?: string | null;
  qaLeadId?: string | null;
  deadline?: string | null;
  description?: string | null;
  checklistTemplateId?: string | null;
  languages?: string[];
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

/** Allowed ISO-like language codes for `Product.languages` (lowercase). */
function normalizeProductLanguages(input: unknown): string[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) {
    throw new BadRequestException('languages must be an array of strings');
  }
  const out = new Set<string>();
  for (const v of input) {
    if (typeof v !== 'string') continue;
    const s = v.trim().toLowerCase();
    if (s.length < 2 || s.length > 12) continue;
    if (/^[a-z]{2}(-[a-z]{2})?$/.test(s)) out.add(s);
  }
  return Array.from(out);
}

type ProductSlotSyncRow = {
  id: string;
  projectId: string;
  pmId: string | null;
  developerId: string | null;
  designerId: string | null;
  technicalSpecialistId: string | null;
  qaLeadId: string | null;
};

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
    private readonly partnerAccrualClassic: PartnerAccrualClassicService,
    private readonly audit: AuditService,
    private readonly deliveryStageChecklistSync: DeliveryStageChecklistSyncService,
    private readonly checklistTemplates: ChecklistTemplatesService,
    private readonly productTeamSync: ProductTeamSyncService,
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
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { project: { name: { contains: q, mode: 'insensitive' } } },
        { project: { code: { contains: q, mode: 'insensitive' } } },
        { order: { code: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const scopedWhere = mergeActiveParentProjectScope(where, { projectId });

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: scopedWhere,
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
      this.prisma.product.count({ where: scopedWhere }),
    ]);

    const openByProduct = await batchProductOpenCounts(
      this.prisma,
      items.map((p) => p.id),
    );

    const lifecycleByProduct = new Map(
      items.map((product) => [product.id, attachProductDeliveryLifecycle(product)]),
    );
    const checklistProgressMap = await loadStageChecklistProgressByOwner(
      this.prisma,
      items.map((product) => ({
        ownerEntityType: 'PRODUCT' as const,
        ownerEntityId: product.id,
        stage: lifecycleByProduct.get(product.id)?.deliveryLifecycle.stage ?? null,
      })),
    );

    return {
      items: items.map((product) => {
        const withLc =
          lifecycleByProduct.get(product.id) ?? attachProductDeliveryLifecycle(product);
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
        const checklistStageProgress = pickProgressForEntity(
          checklistProgressMap,
          'PRODUCT',
          product.id,
          withLc.deliveryLifecycle.stage,
        );
        const currentStageReadiness = mergeChecklistIntoReadiness(
          readiness,
          checklistStageProgress,
        );
        return {
          ...withLc,
          deliveryLifecycle: {
            ...withLc.deliveryLifecycle,
            ...(currentStageReadiness ? { currentStageReadiness } : {}),
          },
          checklistStageProgress,
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
            contactId: true,
            companyId: true,
            company: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
            credentials: {
              where: { trashedAt: null },
              select: { category: true },
            },
            domains: { select: { status: true } },
            _count: {
              select: {
                credentials: { where: { trashedAt: null } },
                domains: true,
              },
            },
          },
        },
        pm: { select: { id: true, firstName: true, lastName: true, email: true } },
        developer: { select: { id: true, firstName: true, lastName: true, email: true } },
        designer: { select: { id: true, firstName: true, lastName: true, email: true } },
        technicalSpecialist: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        qaLead: { select: { id: true, firstName: true, lastName: true, email: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
        technicalProfiles: {
          select: {
            productionUrl: true,
            stagingUrl: true,
            repositoryUrl: true,
            hostingProvider: true,
            technicalOwnerId: true,
          },
        },
        order: {
          include: {
            deal: {
              select: {
                id: true,
                name: true,
                code: true,
                offerFileUrl: true,
                contractFileUrl: true,
                seller: { select: { id: true, firstName: true, lastName: true } },
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
            order: {
              select: {
                id: true,
                deal: { select: { id: true, code: true, name: true } },
              },
            },
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
        workSpace: { select: { id: true } },
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    const { workSpace, ...productRecord } = product;
    const checklistProgressMap = await loadStageChecklistProgressByOwner(this.prisma, [
      {
        ownerEntityType: 'PRODUCT',
        ownerEntityId: productRecord.id,
        stage: attachProductDeliveryLifecycle(productRecord).deliveryLifecycle.stage,
      },
    ]);
    const withLc = attachProductDeliveryLifecycle(productRecord);
    const checklistStageProgress = pickProgressForEntity(
      checklistProgressMap,
      'PRODUCT',
      productRecord.id,
      withLc.deliveryLifecycle.stage,
    );
    return {
      ...withLc,
      workSpaceId: workSpace?.id ?? null,
      doneReadiness: buildProductDoneReadiness(productRecord),
      checklistStageProgress,
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
        languages: normalizeProductLanguages(data.languages ?? []),
        deliveryStage: 'STARTING',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        pm: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(product.id);
    await this.syncProductTeamAccess(product);
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
        ...(data.developerId !== undefined && { developerId: data.developerId }),
        ...(data.designerId !== undefined && { designerId: data.designerId }),
        ...(data.technicalSpecialistId !== undefined && {
          technicalSpecialistId: data.technicalSpecialistId,
        }),
        ...(data.qaLeadId !== undefined && { qaLeadId: data.qaLeadId }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.checklistTemplateId !== undefined && {
          checklistTemplateId: data.checklistTemplateId,
        }),
        ...(data.languages !== undefined && {
          languages: normalizeProductLanguages(data.languages),
        }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        pm: { select: { id: true, firstName: true, lastName: true } },
        developer: { select: { id: true, firstName: true, lastName: true } },
        designer: { select: { id: true, firstName: true, lastName: true } },
        technicalSpecialist: {
          select: { id: true, firstName: true, lastName: true },
        },
        qaLead: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.syncProductTeamAccess(product);
    return attachProductDeliveryLifecycle(product);
  }

  async updateStatus(id: string, newStatus: string, actorId: string) {
    const product = await this.findById(id);
    const current = product.status as ProductStatusEnum;
    const target = newStatus as ProductStatusEnum;

    if (!PRODUCT_STATUS_ORDER.includes(target)) {
      throw new BadRequestException(`Invalid status: ${newStatus}`);
    }

    validateProductTransition(current, target);
    validateProductStageGate(product, target);
    if (target === 'DEVELOPMENT') await this.validateDevelopmentGate(product);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, product) },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
    });
    await this.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(updatedProduct.id);
    if (isLegacyPatchStatusTerminalOutcome(target)) {
      await this.audit.log({
        entityType: 'PRODUCT',
        entityId: id,
        action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
        userId: actorId,
        projectId: product.projectId,
        changes: {
          deprecatedApiPath: 'PATCH /projects/products/:id/status',
          previousStatus: current,
          targetStatus: target,
          deliveryResolution: target === 'DONE' ? 'DONE' : 'CANCELLED',
        } as InputJsonValue,
      });
    }
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async moveStage(id: string, data: MoveStageDto) {
    const product = await this.findById(id);
    this.ensureActiveForStageMove(product.deliveryLifecycle);
    const stage = this.parseDeliveryStage(data.stage);
    const target = productLegacyStatusForStage(stage) as ProductStatusEnum;

    validateProductTransition(product.status as ProductStatusEnum, target);
    validateProductStageGate(product, target);
    if (target === 'DEVELOPMENT') await this.validateDevelopmentGate(product);

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, product) },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    await this.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(updatedProduct.id);
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
    await this.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(updatedProduct.id);
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async cancel(id: string, data: CancelDeliveryDto, actorId: string) {
    const product = await this.findById(id);
    this.ensureNotTerminal(product.deliveryLifecycle.resolution);
    const reason = requireText(data.reason, 'reason');
    const closedAt = new Date();
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: 'LOST',
        ...buildDeliveryLifecycleWrite('LOST', product),
        cancellationReason: reason,
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.audit.log({
      entityType: 'PRODUCT',
      entityId: id,
      action: 'delivery.cancelled',
      userId: actorId,
      projectId: product.projectId,
      changes: { reason } as InputJsonValue,
    });
    return attachProductDeliveryLifecycle(updatedProduct);
  }

  async complete(id: string, actorId: string) {
    const product = await this.findById(id);
    this.ensureActiveForStageMove(product.deliveryLifecycle);
    const target = 'DONE' as ProductStatusEnum;

    validateProductTransition(product.status as ProductStatusEnum, target);
    validateProductStageGate(product, target);

    const closedAt = new Date();
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        status: target,
        ...buildDeliveryLifecycleWrite(target, product),
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const linkedOrder = await this.prisma.order.findUnique({
      where: { productId: id },
      select: { id: true },
    });
    if (linkedOrder) {
      await syncProductBonusPoolForOrder(this.prisma, linkedOrder.id, this.notifications);
      await this.partnerAccrualClassic.tryInboundClassicAfterDelivery(linkedOrder.id);
    }
    await this.audit.log({
      entityType: 'PRODUCT',
      entityId: id,
      action: 'delivery.completed',
      userId: actorId,
      projectId: product.projectId,
      changes: { deliveryResolution: 'DONE' } as InputJsonValue,
    });
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

  /** @deprecated Hard delete removed — use PATCH :id/cancel or :id/complete. */
  async delete(id: string): Promise<never> {
    await this.findById(id);
    throw new ConflictException(
      'Products cannot be deleted. Cancel delivery (PATCH /products/:id/cancel) or complete it (PATCH /products/:id/complete).',
    );
  }

  async getStats(projectId?: string) {
    const where = mergeActiveParentProjectScope(projectId ? { projectId } : {}, { projectId });

    const [total, byStatus, byType] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.product.groupBy({ by: ['productType'], where, _count: true }),
    ]);

    return { total, byStatus, byType };
  }

  private async syncProductTeamAccess(product: ProductSlotSyncRow): Promise<void> {
    await this.productTeamSync.syncProductSlots({
      productId: product.id,
      projectId: product.projectId,
      row: {
        pmId: product.pmId,
        developerId: product.developerId,
        designerId: product.designerId,
        technicalSpecialistId: product.technicalSpecialistId,
        qaLeadId: product.qaLeadId,
      },
    });
    const sellerId = await this.loadLinkedProductSellerId(product.id);
    await this.productTeamSync.syncProductSeller({
      projectId: product.projectId,
      sellerId,
    });
  }

  private async loadLinkedProductSellerId(productId: string): Promise<string | null> {
    const order = await this.prisma.order.findFirst({
      where: { productId },
      select: { deal: { select: { sellerId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return order?.deal?.sellerId ?? null;
  }

  private async validateDevelopmentGate(product: { id: string; deadline?: Date | string | null }) {
    if (!product.deadline) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'STAGE_GATE_VALIDATION',
        message: 'Product deadline must be set before Development.',
        errors: [{ field: 'deadline', message: 'Deadline must be set before Development.' }],
      });
    }
    await this.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(product.id);
    await this.checklistTemplates.assertStageInstancesCompleted({
      ownerEntityType: 'PRODUCT',
      ownerEntityId: product.id,
      deliveryStage: 'STARTING',
    });
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

function mergeChecklistIntoReadiness(
  readiness: { completed: number; total: number } | undefined,
  checklist: { completedChecklists?: number; totalChecklists?: number } | null,
) {
  if (!checklist?.totalChecklists) return readiness;
  const base = readiness ?? { completed: 0, total: 0 };
  const completedChecklists = checklist.completedChecklists ?? 0;
  const totalChecklists = checklist.totalChecklists;
  return {
    completed: base.completed + (completedChecklists >= totalChecklists ? totalChecklists : 0),
    total: base.total + totalChecklists,
  };
}
