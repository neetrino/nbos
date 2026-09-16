import {
  DELIVERY_REALTIME_SCHEMA_VERSION,
  type DeliveryRealtimeEntityType,
  type DeliverySseEventName,
} from './delivery-realtime.constants';

/** Invalidation-only SSE body. Clients refetch through authorized REST. */
export interface DeliveryItemChangedPayload {
  schemaVersion: typeof DELIVERY_REALTIME_SCHEMA_VERSION;
  entityType: DeliveryRealtimeEntityType;
  entityId: string;
  occurredAt: string;
}

export interface DeliveryRealtimeBusMessage {
  event: DeliverySseEventName;
  payload: DeliveryItemChangedPayload;
}
