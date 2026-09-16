/** SSE heartbeat interval (comment frames). Same value as other realtime streams. */
export const DELIVERY_SSE_HEARTBEAT_MS = 25_000;

/** Redis Pub/Sub channel for delivery-board invalidation fan-out. */
export const DELIVERY_REALTIME_CHANNEL = 'nbos:realtime:delivery';

export const DELIVERY_SSE_EVENT = {
  ITEM_CHANGED: 'delivery.item.changed',
} as const;

export type DeliverySseEventName = (typeof DELIVERY_SSE_EVENT)[keyof typeof DELIVERY_SSE_EVENT];

export const DELIVERY_REALTIME_SCHEMA_VERSION = 1 as const;

export const DELIVERY_REALTIME_ENTITY_TYPES = ['product', 'extension'] as const;

export type DeliveryRealtimeEntityType = (typeof DELIVERY_REALTIME_ENTITY_TYPES)[number];

export function isDeliverySseEvent(event: string): event is DeliverySseEventName {
  return event === DELIVERY_SSE_EVENT.ITEM_CHANGED;
}

export function isDeliveryRealtimeEntityType(value: string): value is DeliveryRealtimeEntityType {
  return (DELIVERY_REALTIME_ENTITY_TYPES as readonly string[]).includes(value);
}
