import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { employeePersonSelect } from '../../../common/employee-person.select';
import { NotificationService } from '../../notifications/notification.service';
import { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import { PartnerAccrualSubscriptionService } from '../../finance/partner-accrual/partner-accrual-subscription.service';
import { SupportService } from '../../support/support.service';
import { AuditService } from '../../audit/audit.service';
import { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import { ProductTeamSyncService } from '../../platform-access/product-team-sync.service';
import { DeliveryRealtimePublisher } from '../../realtime/delivery-realtime.publisher';
import { attachExtensionReadiness } from './extension-stage-gates';
import { findExtensionById } from './extension-detail-read';
import { findAllExtensions, type ExtensionQueryParams } from './extension-find-all';
import { getExtensionStats } from './extension-stats';
import { requireText } from './extension-input';
import { ensureProductBelongsToProject } from './extension-lifecycle-writes';
import {
  cancelExtension,
  completeExtension,
  moveExtensionStage,
  pauseExtension,
  resumeExtension,
  updateExtensionStatus,
  type CancelDeliveryDto,
  type MoveStageDto,
  type PauseDeliveryDto,
  type ExtensionDeliveryCommandDeps,
} from './extension-delivery-commands';

interface CreateExtensionDto {
  projectId: string;
  productId: string;
  name: string;
  assignedTo?: string;
  description?: string;
}

interface UpdateExtensionDto {
  name?: string;
  productId?: string;
  assignedTo?: string | null;
  description?: string | null;
}

@Injectable()
export class ExtensionsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
    private readonly partnerAccrualClassic: PartnerAccrualClassicService,
    private readonly partnerAccrualSubscription: PartnerAccrualSubscriptionService,
    private readonly supportService: SupportService,
    private readonly audit: AuditService,
    private readonly deliveryStageChecklistSync: DeliveryStageChecklistSyncService,
    private readonly checklistTemplates: ChecklistTemplatesService,
    private readonly productTeamSync: ProductTeamSyncService,
    private readonly deliveryRealtime: DeliveryRealtimePublisher,
  ) {}

  async findAll(params: ExtensionQueryParams) {
    return findAllExtensions(this.prisma, params);
  }

  async findById(id: string) {
    return findExtensionById(this.prisma, id);
  }

  async create(data: CreateExtensionDto) {
    const productId = requireText(data.productId, 'productId');
    await ensureProductBelongsToProject(this.prisma, productId, data.projectId);
    const extension = await this.prisma.extension.create({
      data: {
        projectId: data.projectId,
        productId,
        name: data.name,
        assignedTo: data.assignedTo,
        description: data.description,
        deliveryStage: 'STARTING',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true } },
        assignee: { select: employeePersonSelect },
      },
    });
    await this.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(extension.id);
    await this.productTeamSync.syncExtensionAssignee({
      productId: extension.productId,
      projectId: extension.projectId,
      assignedTo: extension.assignedTo,
    });
    return attachExtensionReadiness(extension);
  }

  async update(id: string, data: UpdateExtensionDto) {
    const current = await findExtensionById(this.prisma, id);
    const productId =
      data.productId !== undefined
        ? requireText(data.productId ?? undefined, 'productId')
        : undefined;
    if (productId) await ensureProductBelongsToProject(this.prisma, productId, current.projectId);
    const extension = await this.prisma.extension.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(productId !== undefined && { productId }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true } },
        assignee: { select: employeePersonSelect },
      },
    });
    if (data.assignedTo !== undefined) {
      await this.productTeamSync.syncExtensionAssignee({
        productId: extension.productId,
        projectId: extension.projectId,
        assignedTo: extension.assignedTo,
      });
    }
    return attachExtensionReadiness(extension);
  }

  async updateStatus(id: string, newStatus: string, actorId: string) {
    return updateExtensionStatus(this.deliveryDeps(), id, newStatus, actorId);
  }

  async moveStage(id: string, data: MoveStageDto, actorId?: string) {
    return moveExtensionStage(this.deliveryDeps(), id, data, actorId);
  }

  async pause(id: string, data: PauseDeliveryDto) {
    return pauseExtension(this.deliveryDeps(), id, data);
  }

  async resume(id: string) {
    return resumeExtension(this.deliveryDeps(), id);
  }

  async cancel(id: string, data: CancelDeliveryDto, actorId: string) {
    return cancelExtension(this.deliveryDeps(), id, data, actorId);
  }

  async complete(id: string, actorId: string) {
    return completeExtension(this.deliveryDeps(), id, actorId);
  }

  /** @deprecated Hard delete removed — use PATCH :id/cancel or :id/complete. */
  async delete(id: string): Promise<never> {
    await findExtensionById(this.prisma, id);
    throw new ConflictException(
      'Extensions cannot be deleted. Cancel delivery (PATCH /extensions/:id/cancel) or complete it (PATCH /extensions/:id/complete).',
    );
  }

  async getStats(projectId?: string) {
    return getExtensionStats(this.prisma, projectId);
  }

  private deliveryDeps(): ExtensionDeliveryCommandDeps {
    return {
      prisma: this.prisma,
      notifications: this.notifications,
      partnerAccrualClassic: this.partnerAccrualClassic,
      partnerAccrualSubscription: this.partnerAccrualSubscription,
      supportService: this.supportService,
      audit: this.audit,
      deliveryStageChecklistSync: this.deliveryStageChecklistSync,
      checklistTemplates: this.checklistTemplates,
      deliveryRealtime: this.deliveryRealtime,
    };
  }
}
