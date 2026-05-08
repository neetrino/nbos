import { Inject, Injectable, Logger } from '@nestjs/common';
import { DeliveryChecklistTargetEnum, PrismaClient, type DeliveryStageEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { ChecklistTemplatesService } from './checklist-templates.service';
import {
  entityHasOpenDeliveryContext,
  extensionRuleMatchesFilter,
  productRuleMatchesFilter,
} from './delivery-stage-checklist-rule-match';

@Injectable()
export class DeliveryStageChecklistSyncService {
  private readonly logger = new Logger(DeliveryStageChecklistSyncService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly checklistTemplates: ChecklistTemplatesService,
  ) {}

  async syncProductAfterLifecycleWrite(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        deliveryStage: true,
        deliveryResolution: true,
        productCategory: true,
        productType: true,
      },
    });
    if (!product || !entityHasOpenDeliveryContext(product)) {
      return;
    }

    const rules = await this.prisma.deliveryStageChecklistRule.findMany({
      where: {
        target: DeliveryChecklistTargetEnum.PRODUCT,
        deliveryStage: product.deliveryStage,
        isActive: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const matched = rules.filter((r) =>
      productRuleMatchesFilter(
        {
          filterProductCategory: r.filterProductCategory,
          filterProductType: r.filterProductType,
        },
        product,
      ),
    );

    await this.applyRulesForOwner('PRODUCT', product.id, product.deliveryStage, matched);
  }

  async syncExtensionAfterLifecycleWrite(extensionId: string): Promise<void> {
    const extension = await this.prisma.extension.findUnique({
      where: { id: extensionId },
      select: {
        id: true,
        deliveryStage: true,
        deliveryResolution: true,
        size: true,
      },
    });
    if (!extension || !entityHasOpenDeliveryContext(extension)) {
      return;
    }

    const rules = await this.prisma.deliveryStageChecklistRule.findMany({
      where: {
        target: DeliveryChecklistTargetEnum.EXTENSION,
        deliveryStage: extension.deliveryStage,
        isActive: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const matched = rules.filter((r) =>
      extensionRuleMatchesFilter({ filterExtensionSize: r.filterExtensionSize }, extension),
    );

    await this.applyRulesForOwner('EXTENSION', extension.id, extension.deliveryStage, matched);
  }

  private async applyRulesForOwner(
    ownerEntityType: 'PRODUCT' | 'EXTENSION',
    ownerEntityId: string,
    deliveryStage: DeliveryStageEnum,
    rules: { id: string; checklistTemplateId: string }[],
  ): Promise<void> {
    for (const rule of rules) {
      try {
        await this.checklistTemplates.createInstanceFromActiveVersion({
          templateId: rule.checklistTemplateId,
          ownerEntityType,
          ownerEntityId,
          deliveryStage,
        });
      } catch (caught) {
        this.logger.warn({
          msg: 'delivery_stage_checklist_instance_failed',
          ruleId: rule.id,
          ownerEntityType,
          ownerEntityId,
          error: caught instanceof Error ? caught.message : String(caught),
        });
      }
    }
  }
}
