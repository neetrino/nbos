import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { PrismaClient, type ProductCategoryEnum, type ProductTypeEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { employeePersonSelect } from '../../../common/employee-person.select';
import { NotificationService } from '../../notifications/notification.service';
import { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import { PartnerAccrualSubscriptionService } from '../../finance/partner-accrual/partner-accrual-subscription.service';
import { AuditService } from '../../audit/audit.service';
import { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import { ProductTeamSyncService } from '../../platform-access/product-team-sync.service';
import { ProductWhatsAppGroupService } from '../../integrations/whatsapp-gateway/product-whatsapp-group.service';
import { DeliveryRealtimePublisher } from '../../realtime/delivery-realtime.publisher';
import {
  resolveProjectContactIdForNewProduct,
  syncProductContactLinks,
} from './product-contacts.ops';
import { productContactSummarySelect } from './product-detail-select';
import { findProductById } from './product-detail-read';
import { findAllProducts, type ProductQueryParams } from './product-find-all';
import { getProductStats } from './product-stats';
import {
  normalizeProductLanguages,
  writeProductUpdate,
  type CreateProductDto,
  type UpdateProductDto,
} from './product-write-data';
import { resolveProductPlatform } from './resolve-product-platform';
import {
  enqueueTechnicalSpecialistIfSlotChanged,
  syncProductContactsIfPatched,
  syncProductTeamAccess,
} from './product-team-side-effects';
import {
  cancelProduct,
  completeProduct,
  confirmProductAcceptance,
  pauseProduct,
  resumeProduct,
} from './product-delivery-close';
import {
  type CancelDeliveryDto,
  type ConfirmAcceptanceDto,
  type MoveStageDto,
  type PauseDeliveryDto,
  type ProductDeliveryCommandDeps,
} from './product-delivery-deps';
import { moveProductStage, updateProductStatus } from './product-delivery-stage';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly notifications: NotificationService,
    private readonly partnerAccrualClassic: PartnerAccrualClassicService,
    private readonly partnerAccrualSubscription: PartnerAccrualSubscriptionService,
    private readonly audit: AuditService,
    private readonly deliveryStageChecklistSync: DeliveryStageChecklistSyncService,
    private readonly checklistTemplates: ChecklistTemplatesService,
    private readonly productTeamSync: ProductTeamSyncService,
    private readonly productWhatsApp: ProductWhatsAppGroupService,
    private readonly deliveryRealtime: DeliveryRealtimePublisher,
  ) {}

  async findAll(params: ProductQueryParams) {
    return findAllProducts(this.prisma, params);
  }

  async findById(id: string) {
    return findProductById(this.prisma, id);
  }

  async create(data: CreateProductDto) {
    const contactId =
      data.contactIds?.[0] ??
      (await resolveProjectContactIdForNewProduct(this.prisma, data.projectId));
    const project =
      data.companyId === undefined
        ? await this.prisma.project.findUnique({
            where: { id: data.projectId },
            select: { companyId: true },
          })
        : null;
    const companyId =
      data.companyId !== undefined ? data.companyId : (project?.companyId ?? undefined);
    const product = await this.prisma.product.create({
      data: {
        projectId: data.projectId,
        contactId,
        companyId,
        name: data.name,
        productCategory: data.productCategory as ProductCategoryEnum,
        productType: data.productType as ProductTypeEnum,
        productPlatform: resolveProductPlatform({
          productCategory: data.productCategory,
          productType: data.productType,
          requested: data.productPlatform,
        }),
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
        pm: { select: employeePersonSelect },
        contact: { select: productContactSummarySelect },
      },
    });
    if (data.contactIds && data.contactIds.length > 0) {
      const { primaryContactId } = await syncProductContactLinks(
        this.prisma,
        product.id,
        data.contactIds,
      );
      if (primaryContactId !== contactId) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: { contactId: primaryContactId },
        });
      }
    }
    await this.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(product.id);
    await syncProductTeamAccess(this.prisma, this.productTeamSync, product);
    return findProductById(this.prisma, product.id);
  }

  async update(id: string, data: UpdateProductDto) {
    const previous = await findProductById(this.prisma, id);
    const primaryContactId = await syncProductContactsIfPatched(this.prisma, id, data.contactIds);
    await writeProductUpdate(this.prisma, id, data, primaryContactId);
    const product = await findProductById(this.prisma, id);
    await syncProductTeamAccess(this.prisma, this.productTeamSync, product);
    await enqueueTechnicalSpecialistIfSlotChanged(
      this.productWhatsApp,
      this.logger,
      previous,
      product,
      data,
    );
    return product;
  }

  async updateStatus(id: string, newStatus: string, actorId: string) {
    return updateProductStatus(this.deliveryDeps(), id, newStatus, actorId);
  }

  async moveStage(id: string, data: MoveStageDto, actorId?: string) {
    return moveProductStage(this.deliveryDeps(), id, data, actorId);
  }

  async pause(id: string, data: PauseDeliveryDto) {
    return pauseProduct(this.deliveryDeps(), id, data);
  }

  async resume(id: string) {
    return resumeProduct(this.deliveryDeps(), id);
  }

  async cancel(id: string, data: CancelDeliveryDto, actorId: string) {
    return cancelProduct(this.deliveryDeps(), id, data, actorId);
  }

  async complete(id: string, actorId: string) {
    return completeProduct(this.deliveryDeps(), id, actorId);
  }

  async confirmAcceptance(id: string, data: ConfirmAcceptanceDto) {
    return confirmProductAcceptance(this.deliveryDeps(), id, data);
  }

  /** @deprecated Hard delete removed — use PATCH :id/cancel or :id/complete. */
  async delete(id: string): Promise<never> {
    await findProductById(this.prisma, id);
    throw new ConflictException(
      'Products cannot be deleted. Cancel delivery (PATCH /products/:id/cancel) or complete it (PATCH /products/:id/complete).',
    );
  }

  async getStats(projectId?: string) {
    return getProductStats(this.prisma, projectId);
  }

  private deliveryDeps(): ProductDeliveryCommandDeps {
    return {
      prisma: this.prisma,
      notifications: this.notifications,
      partnerAccrualClassic: this.partnerAccrualClassic,
      partnerAccrualSubscription: this.partnerAccrualSubscription,
      audit: this.audit,
      deliveryStageChecklistSync: this.deliveryStageChecklistSync,
      checklistTemplates: this.checklistTemplates,
      productWhatsApp: this.productWhatsApp,
      deliveryRealtime: this.deliveryRealtime,
      logger: this.logger,
    };
  }
}
