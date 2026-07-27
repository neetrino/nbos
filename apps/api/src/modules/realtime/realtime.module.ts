import { Global, Module } from '@nestjs/common';
import { NotificationRealtimeController } from './notification-realtime.controller';
import { NotificationRealtimeEventBus } from './notification-realtime-event-bus';
import { NotificationRealtimePublisher } from './notification-realtime.publisher';
import { NotificationSseHub } from './notification-sse.hub';

@Global()
@Module({
  controllers: [NotificationRealtimeController],
  providers: [NotificationRealtimeEventBus, NotificationSseHub, NotificationRealtimePublisher],
  exports: [NotificationRealtimeEventBus, NotificationSseHub, NotificationRealtimePublisher],
})
export class RealtimeModule {}
