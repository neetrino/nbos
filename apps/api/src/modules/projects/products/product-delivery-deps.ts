import { Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { NotificationService } from '../../notifications/notification.service';
import type { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import type { PartnerAccrualSubscriptionService } from '../../finance/partner-accrual/partner-accrual-subscription.service';
import type { AuditService } from '../../audit/audit.service';
import type { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import type { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import type { ProductWhatsAppGroupService } from '../../integrations/whatsapp-gateway/product-whatsapp-group.service';
import type { DeliveryRealtimePublisher } from '../../realtime/delivery-realtime.publisher';

export interface PauseDeliveryDto {
  reason: string;
  onHoldUntil: string;
}

export interface CancelDeliveryDto {
  reason: string;
}

export interface MoveStageDto {
  stage: string;
}

export interface ConfirmAcceptanceDto {
  acceptedBy?: string;
  note?: string;
}

export interface ProductDeliveryCommandDeps {
  prisma: InstanceType<typeof PrismaClient>;
  notifications: NotificationService;
  partnerAccrualClassic: PartnerAccrualClassicService;
  partnerAccrualSubscription: PartnerAccrualSubscriptionService;
  audit: AuditService;
  deliveryStageChecklistSync: DeliveryStageChecklistSyncService;
  checklistTemplates: ChecklistTemplatesService;
  productWhatsApp: ProductWhatsAppGroupService;
  deliveryRealtime: DeliveryRealtimePublisher;
  logger: Logger;
}
