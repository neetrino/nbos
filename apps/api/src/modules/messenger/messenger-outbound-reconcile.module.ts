import { Module } from '@nestjs/common';
import { WhatsAppOutboundQueueService } from '../integrations/whatsapp-gateway/whatsapp-outbound-queue.service';
import { MessengerDeliveryStatusModule } from './messenger-delivery-status.module';
import { MessengerOutboundReconcileService } from './messenger-outbound-reconcile.service';

/** Scheduler-safe: queue producer + reconcile + delivery publisher. No Gateway/subscriber/Worker. */
@Module({
  imports: [MessengerDeliveryStatusModule],
  providers: [WhatsAppOutboundQueueService, MessengerOutboundReconcileService],
  exports: [MessengerOutboundReconcileService],
})
export class MessengerOutboundReconcileModule {}
