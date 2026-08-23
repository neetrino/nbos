import { Global, Module } from '@nestjs/common';
import { CallRealtimeController } from './call-realtime.controller';
import { CallRealtimeEventBus } from './call-realtime-event-bus';
import { CallSseHub } from './call-sse.hub';
import { NotificationRealtimeController } from './notification-realtime.controller';
import { NotificationRealtimeEventBus } from './notification-realtime-event-bus';
import { NotificationRealtimePublisher } from './notification-realtime.publisher';
import { NotificationSseHub } from './notification-sse.hub';

@Global()
@Module({
  controllers: [NotificationRealtimeController, CallRealtimeController],
  providers: [
    NotificationRealtimeEventBus,
    NotificationSseHub,
    NotificationRealtimePublisher,
    CallRealtimeEventBus,
    CallSseHub,
  ],
  exports: [
    NotificationRealtimeEventBus,
    NotificationSseHub,
    NotificationRealtimePublisher,
    CallRealtimeEventBus,
    CallSseHub,
  ],
})
export class RealtimeModule {}
