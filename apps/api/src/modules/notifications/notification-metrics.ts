/**
 * Lightweight structured metrics for notification write-path observability.
 * Default: no-op. Set NOTIFICATION_METRICS_LOG=true to emit JSON lines via process stdout sink.
 */
export type NotificationMetricName =
  | 'notification_create_duration_ms'
  | 'notification_bulk_create_duration_ms'
  | 'notification_recipients_requested'
  | 'notification_recipients_filtered'
  | 'notification_rows_inserted'
  | 'notification_duplicates_skipped'
  | 'notification_delivery_rows_created'
  | 'notification_inbox_states_updated'
  | 'notification_sse_events_published'
  | 'notification_outbox_pending'
  | 'notification_outbox_failed'
  | 'notification_enqueue_pending_jobs'
  | 'notification_enqueue_pending_deliveries';

type MetricSink = (line: string) => void;

let sink: MetricSink | null = null;

/** Test/ops hook to capture metric lines. */
export function setNotificationMetricSink(next: MetricSink | null): void {
  sink = next;
}

export function recordNotificationMetric(input: {
  name: NotificationMetricName;
  value: number;
  tags?: Record<string, string>;
}): void {
  const enabled =
    process.env.NOTIFICATION_METRICS_LOG === 'true' || process.env.NOTIFICATION_METRICS_LOG === '1';
  if (!enabled && !sink) return;
  const line = JSON.stringify({
    metric: input.name,
    value: input.value,
    tags: input.tags ?? {},
    at: new Date().toISOString(),
  });
  if (sink) sink(line);
  else if (enabled) {
    process.stdout.write(`${line}\n`);
  }
}
