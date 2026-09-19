import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { DeliveryCompensationRulesController } from './delivery-compensation-rules.controller';
import { DeliveryCompensationRulesPublishService } from './delivery-compensation-rules-publish.service';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';
import { DeliveryConfigurationController } from './delivery-configuration.controller';
import { DeliveryConfigurationService } from './delivery-configuration.service';
import { FunctionCatalogAttachmentsService } from './function-catalog-attachments.service';
import { FunctionCatalogController } from './function-catalog.controller';
import { FunctionCatalogService } from './function-catalog.service';

@Module({
  imports: [NotificationModule],
  controllers: [
    FunctionCatalogController,
    DeliveryCompensationRulesController,
    DeliveryConfigurationController,
  ],
  providers: [
    FunctionCatalogService,
    FunctionCatalogAttachmentsService,
    DeliveryCompensationRulesService,
    DeliveryCompensationRulesPublishService,
    DeliveryConfigurationService,
  ],
  exports: [FunctionCatalogService, DeliveryCompensationRulesService, DeliveryConfigurationService],
})
export class DeliveryCompensationModule {}
