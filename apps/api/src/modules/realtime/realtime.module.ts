import { Global, Module } from '@nestjs/common';
import { CallRealtimeController } from './call-realtime.controller';
import { CallRealtimeEventBus } from './call-realtime-event-bus';
import { CallSseHub } from './call-sse.hub';
import { DeliveryRealtimeController } from './delivery-realtime.controller';
import { DeliveryRealtimeEventBus } from './delivery-realtime-event-bus';
import { DeliveryRealtimePublisher } from './delivery-realtime.publisher';
import { DeliverySseHub } from './delivery-sse.hub';
import { NotificationRealtimeController } from './notification-realtime.controller';
import { NotificationRealtimeEventBus } from './notification-realtime-event-bus';
import { NotificationRealtimePublisher } from './notification-realtime.publisher';
import { NotificationSseHub } from './notification-sse.hub';

@Global()
@Module({
  controllers: [NotificationRealtimeController, CallRealtimeController, DeliveryRealtimeController],
  providers: [
    NotificationRealtimeEventBus,
    NotificationSseHub,
    NotificationRealtimePublisher,
    CallRealtimeEventBus,
    CallSseHub,
    DeliveryRealtimeEventBus,
    DeliverySseHub,
    DeliveryRealtimePublisher,
  ],
  exports: [
    NotificationRealtimeEventBus,
    NotificationSseHub,
    NotificationRealtimePublisher,
    CallRealtimeEventBus,
    CallSseHub,
    DeliveryRealtimeEventBus,
    DeliverySseHub,
    DeliveryRealtimePublisher,
  ],
})
export class RealtimeModule {}
