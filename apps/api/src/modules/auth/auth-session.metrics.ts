/** In-process auth metrics (labels must not include userId/sessionId). */

export type AuthMetricName =
  | 'auth_login_success_total'
  | 'auth_login_failed_total'
  | 'auth_refresh_success_total'
  | 'auth_refresh_failed_total'
  | 'auth_refresh_reuse_detected_total'
  | 'auth_session_revoked_total'
  | 'auth_legacy_token_requests_total'
  | 'auth_v2_token_requests_total'
  | 'auth_denylist_reads_total';

const counters: Record<AuthMetricName, number> = {
  auth_login_success_total: 0,
  auth_login_failed_total: 0,
  auth_refresh_success_total: 0,
  auth_refresh_failed_total: 0,
  auth_refresh_reuse_detected_total: 0,
  auth_session_revoked_total: 0,
  auth_legacy_token_requests_total: 0,
  auth_v2_token_requests_total: 0,
  auth_denylist_reads_total: 0,
};

export function recordAuthMetric(name: AuthMetricName, by = 1): void {
  counters[name] += by;
}

export function getAuthMetrics(): Readonly<Record<AuthMetricName, number>> {
  return { ...counters };
}

export function resetAuthMetricsForTests(): void {
  for (const key of Object.keys(counters) as AuthMetricName[]) {
    counters[key] = 0;
  }
}
