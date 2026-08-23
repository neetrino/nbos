/** Exact hostname from ATS.am canon (`call-record` / `callback` / `history`). */
export const ATS_RECORDING_DEFAULT_ALLOWED_HOST = 'account.ats.am';

/**
 * Optional comma-separated extra exact hostnames for `record_link` / redirects.
 * Fail-closed: unknown hosts are denied. Do not use suffix matching.
 */
export const ATS_RECORDING_ALLOWED_HOSTS_ENV = 'ATS_RECORDING_ALLOWED_HOSTS';

/** Maximum Location hops after the first request. */
export const ATS_CALL_RECORDING_MAX_REDIRECTS = 3;

/** Reject overlong URLs before parse/DNS (tokens may appear in query). */
export const ATS_RECORDING_MAX_URL_LENGTH = 2048;

export const ATS_RECORDING_HTTPS_PORT = 443;

export type AtsRecordingUrlRejectReason =
  | 'malformed'
  | 'scheme'
  | 'credentials'
  | 'port'
  | 'ip_literal'
  | 'hostname'
  | 'dns_failed'
  | 'dns_empty'
  | 'private_ip'
  | 'redirect_missing_location'
  | 'redirect_loop'
  | 'redirect_limit';
