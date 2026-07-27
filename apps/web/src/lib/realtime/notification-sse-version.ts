/**
 * SSE version gate. After READ rollout, reconciliation GET can seed lastVersion
 * with InboxState.version so replicas share one persistent sequence.
 */
export type NotificationSseVersionGate = {
  /** Increments on every successful SSE `open` (including first connect). */
  generation: number;
  /** Last applied SSE / reconcile version for the current generation; null after reset. */
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

/** Seed lastVersion from unread GET reconciliation (persistent InboxState version). */
export function seedNotificationSseVersionFromReconcile(
  gate: NotificationSseVersionGate,
  version: number,
): NotificationSseVersionGate {
  return {
    generation: gate.generation,
    lastVersion: version,
  };
}

/**
 * Returns whether an SSE payload version should update UI for this generation.
 * Equal or older versions are ignored.
 */
export function shouldApplyNotificationSseVersion(
  gate: NotificationSseVersionGate,
  eventGeneration: number,
  version: number,
): { apply: boolean; next: NotificationSseVersionGate } {
  if (eventGeneration !== gate.generation) {
    return { apply: false, next: gate };
  }
  if (gate.lastVersion !== null && version <= gate.lastVersion) {
    return { apply: false, next: gate };
  }
  return {
    apply: true,
    next: { generation: gate.generation, lastVersion: version },
  };
}
