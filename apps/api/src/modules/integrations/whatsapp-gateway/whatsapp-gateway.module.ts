import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { ProductWhatsAppGroupService } from './product-whatsapp-group.service';
import { ProductWhatsAppParticipantResolver } from './product-whatsapp-participant.resolver';
import { ProductWhatsAppController } from './product-whatsapp.controller';
import { WhatsAppGatewayClient } from './whatsapp-gateway.client';
import { WhatsAppGatewayConnectionService } from './whatsapp-gateway-connection.service';
import { WhatsAppGatewayController } from './whatsapp-gateway.controller';
import { WhatsAppGatewaySecretStore } from './whatsapp-gateway-secret.store';
import { WhatsAppProductGroupsQueueService } from './whatsapp-product-groups-queue.service';

/** Producers + HTTP. BullMQ Worker lives in QueueWorkersModule. */
@Module({
  imports: [AuditModule],
  controllers: [WhatsAppGatewayController, ProductWhatsAppController],
  providers: [
    WhatsAppGatewayClient,
    WhatsAppGatewaySecretStore,
    WhatsAppGatewayConnectionService,
    ProductWhatsAppParticipantResolver,
    WhatsAppProductGroupsQueueService,
    ProductWhatsAppGroupService,
  ],
  exports: [
    ProductWhatsAppGroupService,
    WhatsAppGatewayConnectionService,
    WhatsAppGatewayClient,
    ProductWhatsAppParticipantResolver,
    WhatsAppProductGroupsQueueService,
  ],
})
export class WhatsAppGatewayModule {}
