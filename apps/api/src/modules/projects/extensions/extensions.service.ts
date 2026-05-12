import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type ExtensionSizeEnum,
  type ExtensionStatusEnum,
  type DeliveryResolutionEnum,
  type DeliveryStageEnum,
  type DeliveryWorkStatusEnum,
  type InputJsonValue,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { NotificationService } from '../../notifications/notification.service';
import { batchExtensionOpenTaskCounts } from './batch-extension-open-task-counts';
import { buildExtensionCurrentStageReadiness } from './extension-current-stage-readiness';
import {
  attachExtensionReadiness,
  validateExtensionStageGate,
  validateExtensionTransition,
} from './extension-stage-gates';
import {
  buildDeliveryLifecycleWrite,
  buildDeliveryPauseWrite,
  buildDeliveryResumeWrite,
  extensionLegacyStatusForStage,
  requireDeliveryStage,
} from '../delivery-lifecycle';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';
import { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import { SupportService } from '../../support/support.service';
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

interface CreateExtensionDto {
  projectId: string;
  productId: string;
  name: string;
  size?: string;
  assignedTo?: string;
  description?: string;
}

interface UpdateExtensionDto {
  name?: string;
  productId?: string;
  size?: string;
  assignedTo?: string | null;
  description?: string | null;
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

interface ExtensionQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  /** Filter by project's billing company (CRM). */
  companyId?: string;
  productId?: string;
  status?: string;
  deliveryStage?: string;
  deliveryWorkStatus?: string;
  deliveryResolution?: string;
  size?: string;
  assignedTo?: string;
  search?: string;
}

@Injectable()
export class ExtensionsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
    private readonly partnerAccrualClassic: PartnerAccrualClassicService,
    private readonly supportService: SupportService,
    private readonly audit: AuditService,
    private readonly deliveryStageChecklistSync: DeliveryStageChecklistSyncService,
    private readonly checklistTemplates: ChecklistTemplatesService,
  ) {}

  async findAll(params: ExtensionQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      companyId,
      productId,
      status,
      deliveryStage,
      deliveryWorkStatus,
      deliveryResolution,
      size,
      assignedTo,
      search,
    } = params;
    const where: Prisma.ExtensionWhereInput = {};

    if (projectId) where.projectId = projectId;
    if (companyId) {
      where.project = { is: { companyId } };
    }
    if (productId) where.productId = productId;
    if (status) where.status = status as ExtensionStatusEnum;
    if (deliveryStage) where.deliveryStage = deliveryStage as DeliveryStageEnum;
    if (deliveryWorkStatus) {
      where.deliveryWorkStatus = deliveryWorkStatus as DeliveryWorkStatusEnum;
    }
    if (deliveryResolution) {
      where.deliveryResolution = deliveryResolution as DeliveryResolutionEnum;
    }
    if (size) where.size = size as ExtensionSizeEnum;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.extension.findMany({
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
          product: { select: { id: true, name: true, productType: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          order: {
            select: {
              id: true,
              code: true,
              status: true,
              invoices: { select: { moneyStatus: true } },
            },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.extension.count({ where }),
    ]);

    const openTasksByExt = await batchExtensionOpenTaskCounts(
      this.prisma,
      items.map((e) => e.id),
    );

    const lifecycleByExtension = new Map(
      items.map((extension) => [extension.id, attachExtensionReadiness(extension)]),
    );
    const checklistProgressMap = await loadStageChecklistProgressByOwner(
      this.prisma,
      items.map((extension) => ({
        ownerEntityType: 'EXTENSION' as const,
        ownerEntityId: extension.id,
        stage: lifecycleByExtension.get(extension.id)?.deliveryLifecycle.stage ?? null,
      })),
    );

    return {
      items: items.map((extension) => {
        const base = lifecycleByExtension.get(extension.id) ?? attachExtensionReadiness(extension);
        const openTasks = openTasksByExt.get(extension.id) ?? 0;
        const readiness = buildExtensionCurrentStageReadiness(extension, base.deliveryLifecycle, {
          openTasks,
        });
        const checklistStageProgress = pickProgressForEntity(
          checklistProgressMap,
          'EXTENSION',
          extension.id,
          base.deliveryLifecycle.stage,
        );
        const currentStageReadiness = mergeChecklistIntoReadiness(
          readiness,
          checklistStageProgress,
        );
        return {
          ...base,
          deliveryLifecycle: {
            ...base.deliveryLifecycle,
            ...(currentStageReadiness ? { currentStageReadiness } : {}),
          },
          checklistStageProgress,
        };
      }),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const extension = await this.prisma.extension.findUnique({
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
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            productType: true,
            status: true,
            languages: true,
            technicalProfiles: {
              select: {
                productionUrl: true,
                stagingUrl: true,
                repositoryUrl: true,
                hostingProvider: true,
                technicalOwnerId: true,
              },
            },
          },
        },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
        order: {
          include: {
            deal: {
              select: {
                id: true,
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
        tasks: {
          select: { id: true, code: true, title: true, status: true, priority: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!extension) throw new NotFoundException(`Extension ${id} not found`);
    const base = attachExtensionReadiness(extension);
    const checklistProgressMap = await loadStageChecklistProgressByOwner(this.prisma, [
      {
        ownerEntityType: 'EXTENSION',
        ownerEntityId: extension.id,
        stage: attachExtensionReadiness(extension).deliveryLifecycle.stage,
      },
    ]);
    return {
      ...base,
      checklistStageProgress: pickProgressForEntity(
        checklistProgressMap,
        'EXTENSION',
        extension.id,
        base.deliveryLifecycle.stage,
      ),
    };
  }

  async create(data: CreateExtensionDto) {
    const productId = requireText(data.productId, 'productId');
    await this.ensureProductBelongsToProject(productId, data.projectId);
    const extension = await this.prisma.extension.create({
      data: {
        projectId: data.projectId,
        productId,
        name: data.name,
        size: (data.size as ExtensionSizeEnum) ?? 'SMALL',
        assignedTo: data.assignedTo,
        description: data.description,
        deliveryStage: 'STARTING',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(extension.id);
    return attachExtensionReadiness(extension);
  }

  async update(id: string, data: UpdateExtensionDto) {
    const current = await this.findById(id);
    const productId =
      data.productId !== undefined
        ? requireText(data.productId ?? undefined, 'productId')
        : undefined;
    if (productId) await this.ensureProductBelongsToProject(productId, current.projectId);
    const extension = await this.prisma.extension.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(productId !== undefined && { productId }),
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
    return attachExtensionReadiness(extension);
  }

  async updateStatus(id: string, newStatus: string, actorId: string) {
    const extension = await this.findById(id);
    const current = extension.status as ExtensionStatusEnum;
    const target = newStatus as ExtensionStatusEnum;

    validateExtensionTransition(current, target);
    validateExtensionStageGate(extension, target);

    const updated = await this.prisma.extension.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, extension) },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
      },
    });
    await this.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(updated.id);
    if (isLegacyPatchStatusTerminalOutcome(target)) {
      await this.audit.log({
        entityType: 'EXTENSION',
        entityId: id,
        action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
        userId: actorId,
        projectId: extension.projectId,
        changes: {
          deprecatedApiPath: 'PATCH /projects/extensions/:id/status',
          previousStatus: current,
          targetStatus: target,
          deliveryResolution: target === 'DONE' ? 'DONE' : 'CANCELLED',
        } as InputJsonValue,
      });
    }
    return attachExtensionReadiness(updated);
  }

  async moveStage(id: string, data: MoveStageDto) {
    const extension = await this.findById(id);
    this.ensureActiveForStageMove(extension.deliveryLifecycle);
    const stage = this.parseDeliveryStage(data.stage);
    const target = extensionLegacyStatusForStage(stage) as ExtensionStatusEnum;

    validateExtensionTransition(extension.status as ExtensionStatusEnum, target);
    validateExtensionStageGate(extension, target);
    if (target === 'DEVELOPMENT') await this.validateDevelopmentGate(extension.id);

    const updated = await this.prisma.extension.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, extension) },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
      },
    });
    await this.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(updated.id);
    return attachExtensionReadiness(updated);
  }

  async pause(id: string, data: PauseDeliveryDto) {
    const extension = await this.findById(id);
    this.ensureNotTerminal(extension.deliveryLifecycle.resolution);
    const reason = requireText(data.reason, 'reason');
    const onHoldUntil = parseDate(data.onHoldUntil, 'onHoldUntil');
    const updated = await this.prisma.extension.update({
      where: { id },
      data: buildDeliveryPauseWrite(extension, reason, onHoldUntil),
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
      },
    });
    return attachExtensionReadiness(updated);
  }

  async resume(id: string) {
    const extension = await this.findById(id);
    this.ensureNotTerminal(extension.deliveryLifecycle.resolution);
    if (extension.deliveryLifecycle.workStatus !== 'ON_HOLD') {
      throw new BadRequestException('Extension is not on hold');
    }
    const nextStatus = extensionLegacyStatusForStage(extension.deliveryLifecycle.stage);
    const updated = await this.prisma.extension.update({
      where: { id },
      data: { status: nextStatus as ExtensionStatusEnum, ...buildDeliveryResumeWrite(extension) },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
      },
    });
    await this.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(updated.id);
    return attachExtensionReadiness(updated);
  }

  async cancel(id: string, data: CancelDeliveryDto, actorId: string) {
    const extension = await this.findById(id);
    this.ensureNotTerminal(extension.deliveryLifecycle.resolution);
    const reason = requireText(data.reason, 'reason');
    const closedAt = new Date();
    const updated = await this.prisma.extension.update({
      where: { id },
      data: {
        status: 'LOST',
        ...buildDeliveryLifecycleWrite('LOST', extension),
        cancellationReason: reason,
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.audit.log({
      entityType: 'EXTENSION',
      entityId: id,
      action: 'delivery.cancelled',
      userId: actorId,
      projectId: extension.projectId,
      changes: { reason } as InputJsonValue,
    });
    return attachExtensionReadiness(updated);
  }

  async complete(id: string, actorId: string) {
    const extension = await this.findById(id);
    this.ensureActiveForStageMove(extension.deliveryLifecycle);
    const target = 'DONE' as ExtensionStatusEnum;

    validateExtensionTransition(extension.status as ExtensionStatusEnum, target);
    validateExtensionStageGate(extension, target);
    if (target === 'DEVELOPMENT') await this.validateDevelopmentGate(extension.id);

    const closedAt = new Date();
    const updated = await this.prisma.extension.update({
      where: { id },
      data: {
        status: target,
        ...buildDeliveryLifecycleWrite(target, extension),
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const linkedOrder = await this.prisma.order.findUnique({
      where: { extensionId: id },
      select: { id: true },
    });
    if (linkedOrder) {
      await syncProductBonusPoolForOrder(this.prisma, linkedOrder.id, this.notifications);
      await this.partnerAccrualClassic.tryInboundClassicAfterDelivery(linkedOrder.id);
    }
    await this.supportService.closeLinkedTicketsAfterExtensionDelivered(id, actorId);
    await this.audit.log({
      entityType: 'EXTENSION',
      entityId: id,
      action: 'delivery.completed',
      userId: actorId,
      projectId: extension.projectId,
      changes: { deliveryResolution: 'DONE' } as InputJsonValue,
    });
    return attachExtensionReadiness(updated);
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

  private ensureNotTerminal(resolution: string | null) {
    if (resolution) {
      throw new BadRequestException('Terminal delivery item cannot be changed');
    }
  }

  private ensureActiveForStageMove(lifecycle: { resolution: string | null; workStatus: string }) {
    this.ensureNotTerminal(lifecycle.resolution);
    if (lifecycle.workStatus === 'ON_HOLD') {
      throw new BadRequestException('Paused extension must be resumed before stage movement');
    }
  }

  private parseDeliveryStage(stage: string) {
    try {
      return requireDeliveryStage(stage);
    } catch {
      throw new BadRequestException(`Invalid delivery stage: ${stage}`);
    }
  }

  private async validateDevelopmentGate(extensionId: string) {
    await this.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(extensionId);
    await this.checklistTemplates.assertStageInstancesCompleted({
      ownerEntityType: 'EXTENSION',
      ownerEntityId: extensionId,
      deliveryStage: 'STARTING',
    });
  }

  private async ensureProductBelongsToProject(productId: string, projectId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true },
    });

    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.projectId !== projectId) {
      throw new BadRequestException('Extension product must belong to the same project');
    }
  }
}

function requireText(value: string | undefined, field: string) {
  const text = value?.trim();
  if (!text) throw new BadRequestException(`${field} is required`);
  return text;
}

function parseDate(value: string | undefined, field: string) {
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
