import { Injectable, Logger } from '@nestjs/common';
import {
  DELIVERY_REALTIME_SCHEMA_VERSION,
  DELIVERY_SSE_EVENT,
  type DeliveryRealtimeEntityType,
} from './delivery-realtime.constants';
import { DeliveryRealtimeEventBus } from './delivery-realtime-event-bus';

/**
 * Publishes delivery-board invalidation events **after** DB work has committed.
 * Failures are logged and swallowed so the originating write still succeeds.
 */
@Injectable()
export class DeliveryRealtimePublisher {
  private readonly logger = new Logger(DeliveryRealtimePublisher.name);

  constructor(private readonly eventBus: DeliveryRealtimeEventBus) {}

  async publishItemChanged(
    entityType: DeliveryRealtimeEntityType,
    entityId: string,
  ): Promise<void> {
    try {
      await this.eventBus.publish({
        event: DELIVERY_SSE_EVENT.ITEM_CHANGED,
        payload: {
          schemaVersion: DELIVERY_REALTIME_SCHEMA_VERSION,
          entityType,
          entityId,
          occurredAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to publish delivery item changed: ${String(err)}`);
    }
  }
}
