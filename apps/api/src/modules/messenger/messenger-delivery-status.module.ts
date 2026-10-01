import { Global, Module } from '@nestjs/common';
import { MessengerDeliveryStatusBus } from './core/messenger-delivery-status-bus';
import { MessengerPersistedCoreMessageBus } from './core/messenger-persisted-core-message-bus';

@Global()
@Module({
  providers: [MessengerDeliveryStatusBus, MessengerPersistedCoreMessageBus],
  exports: [MessengerDeliveryStatusBus, MessengerPersistedCoreMessageBus],
})
export class MessengerDeliveryStatusModule {}
