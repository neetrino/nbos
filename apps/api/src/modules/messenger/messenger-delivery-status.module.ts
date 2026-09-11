import { Global, Module } from '@nestjs/common';
import { MessengerDeliveryStatusBus } from './core/messenger-delivery-status-bus';

@Global()
@Module({
  providers: [MessengerDeliveryStatusBus],
  exports: [MessengerDeliveryStatusBus],
})
export class MessengerDeliveryStatusModule {}
