/**
 * Process-local SSE versions reset on API restart. Compare versions only within
 * one SSE connection generation — never across reconnects.
 */
export type NotificationSseVersionGate = {
  /** Increments on every successful SSE `open` (including first connect). */
  generation: number;
  /** Last applied SSE version for the current generation; null after reset. */
  lastVersion: number | null;
};

export function createNotificationSseVersionGate(): NotificationSseVersionGate {
  return { generation: 0, lastVersion: null };
}

/** Call on every EventSource `open` before reconciliation. */
export function resetNotificationSseVersionOnOpen(
  gate: NotificationSseVersionGate,
): NotificationSseVersionGate {
  return {
    generation: gate.generation + 1,
    lastVersion: null,
  };
}

/**
 * Returns whether an SSE payload version should update UI for this generation.
 * Stale events from a previous connection generation are ignored.
 */
export function shouldApplyNotificationSseVersion(
  gate: NotificationSseVersionGate,
  eventGeneration: number,
  version: number,
): { apply: boolean; next: NotificationSseVersionGate } {
  if (eventGeneration !== gate.generation) {
    return { apply: false, next: gate };
  }
  if (gate.lastVersion !== null && version < gate.lastVersion) {
    return { apply: false, next: gate };
  }
  return {
    apply: true,
    next: { generation: gate.generation, lastVersion: version },
  };
}
