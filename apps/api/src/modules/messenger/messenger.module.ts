import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessengerCoreActionsController } from './core/messenger-core-actions.controller';
import { MessengerCoreActionsService } from './core/messenger-core-actions.service';
import { MessengerCoreClientCollectionController } from './core/messenger-core-client-collection.controller';
import { MessengerCoreClientController } from './core/messenger-core-client.controller';
import { MessengerCoreClientService } from './core/messenger-core-client.service';
import { MessengerCoreCollectionController } from './core/messenger-core-collection.controller';
import { MessengerCoreCollectionService } from './core/messenger-core-collection.service';
import { MessengerCoreController } from './core/messenger-core.controller';
import { MessengerCoreInternalCollectionController } from './core/messenger-core-internal-collection.controller';
import { MessengerCoreInternalController } from './core/messenger-core-internal.controller';
import { MessengerCoreInternalEntityController } from './core/messenger-core-internal-entity.controller';
import { MessengerCoreInternalService } from './core/messenger-core-internal.service';
import { MessengerCoreService } from './core/messenger-core.service';
import { MessengerController } from './messenger.controller';
import { MessengerGateway } from './messenger.gateway';
import { MessengerService } from './messenger.service';
import { WhatsAppGatewayModule } from '../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { WhatsAppGatewayWebhookController } from '../integrations/whatsapp-gateway/whatsapp-gateway-webhook.controller';
import { WhatsAppGatewayWebhookService } from '../integrations/whatsapp-gateway/whatsapp-gateway-webhook.service';
import { MessengerDeliveryStatusModule } from './messenger-delivery-status.module';
import { MessengerDeliveryStatusSubscriber } from './messenger-delivery-status.subscriber';

@Module({
  imports: [AuditModule, WhatsAppGatewayModule, MessengerDeliveryStatusModule],
  controllers: [
    MessengerController,
    MessengerCoreController,
    MessengerCoreActionsController,
    MessengerCoreCollectionController,
    MessengerCoreInternalController,
    MessengerCoreInternalEntityController,
    MessengerCoreInternalCollectionController,
    MessengerCoreClientController,
    MessengerCoreClientCollectionController,
    WhatsAppGatewayWebhookController,
  ],
  providers: [
    MessengerService,
    MessengerCoreService,
    MessengerCoreActionsService,
    MessengerCoreInternalService,
    MessengerCoreClientService,
    MessengerCoreCollectionService,
    MessengerGateway,
    WhatsAppGatewayWebhookService,
    MessengerDeliveryStatusSubscriber,
  ],
  exports: [MessengerService, MessengerCoreService, MessengerGateway],
})
export class MessengerModule {}
