/**
 * In-process counters for InboxState READ rollout (no high-cardinality labels).
 */
type Counters = {
  notification_inbox_read_fallback_total: number;
  notification_inbox_missing_state_total: number;
  notification_inbox_drift_detected_total: number;
  notification_inbox_repair_total: number;
  notification_inbox_shadow_mismatch_total: number;
};

const counters: Counters = {
  notification_inbox_read_fallback_total: 0,
  notification_inbox_missing_state_total: 0,
  notification_inbox_drift_detected_total: 0,
  notification_inbox_repair_total: 0,
  notification_inbox_shadow_mismatch_total: 0,
};

export function recordInboxMetric(name: keyof Counters, delta = 1): void {
  counters[name] += delta;
}

export function getInboxMetrics(): Readonly<Counters> {
  return { ...counters };
}

export function resetInboxMetrics(): void {
  for (const key of Object.keys(counters) as Array<keyof Counters>) {
    counters[key] = 0;
  }
}
