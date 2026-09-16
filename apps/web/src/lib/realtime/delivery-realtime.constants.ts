export const DELIVERY_SSE_PATH = '/api/realtime/delivery';

export const DELIVERY_REALTIME_SCHEMA_VERSION = 1 as const;

export const DELIVERY_SSE_EVENT = {
  ITEM_CHANGED: 'delivery.item.changed',
} as const;

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export const DELIVERY_SSE_RECONNECT_BASE_MS = RECONNECT_BASE_MS;
export const DELIVERY_SSE_RECONNECT_MAX_MS = RECONNECT_MAX_MS;

/** Coalesce bursty delivery-board invalidations (multi-stage drags). */
export const DELIVERY_BOARD_REFETCH_DEBOUNCE_MS = 400;
