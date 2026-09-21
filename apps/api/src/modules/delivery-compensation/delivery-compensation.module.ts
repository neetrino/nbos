import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { DeliveryCompensationRulesController } from './delivery-compensation-rules.controller';
import { DeliveryCompensationRulesPublishService } from './delivery-compensation-rules-publish.service';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';
import { DeliveryConfigurationController } from './delivery-configuration.controller';
import { DeliveryConfigurationService } from './delivery-configuration.service';
import { CatalogStructureController } from './catalog-structure.controller';
import { CatalogStructureService } from './catalog-structure.service';
import { SalePricesService } from './sale-prices.service';
import { FunctionCatalogAttachmentsService } from './function-catalog-attachments.service';
import { FunctionCatalogController } from './function-catalog.controller';
import { FunctionCatalogService } from './function-catalog.service';

@Module({
  imports: [NotificationModule],
  controllers: [
    FunctionCatalogController,
    DeliveryCompensationRulesController,
    DeliveryConfigurationController,
    CatalogStructureController,
  ],
  providers: [
    FunctionCatalogService,
    FunctionCatalogAttachmentsService,
    DeliveryCompensationRulesService,
    DeliveryCompensationRulesPublishService,
    DeliveryConfigurationService,
    CatalogStructureService,
    SalePricesService,
  ],
  exports: [
    FunctionCatalogService,
    DeliveryCompensationRulesService,
    DeliveryConfigurationService,
    CatalogStructureService,
    SalePricesService,
  ],
})
export class DeliveryCompensationModule {}
