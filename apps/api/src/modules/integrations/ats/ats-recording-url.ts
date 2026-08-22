import { isIP } from 'node:net';
import { AtsRecordingPermanentError } from './ats-call-recording.errors';
import {
  ATS_RECORDING_DEFAULT_ALLOWED_HOST,
  ATS_RECORDING_HTTPS_PORT,
  ATS_RECORDING_MAX_URL_LENGTH,
} from './ats-recording-url.constants';

const HOSTNAME_RE =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeAtsRecordingHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/u, '');
}

export function isExactAtsRecordingHostname(hostname: string): boolean {
  return HOSTNAME_RE.test(normalizeAtsRecordingHostname(hostname));
}

export function parseAtsRecordingAllowedHosts(raw: string | undefined): readonly string[] {
  const extras = (raw ?? '')
    .split(',')
    .map((value) => normalizeAtsRecordingHostname(value))
    .filter((value) => value.length > 0 && isExactAtsRecordingHostname(value) && !isIP(value));
  return uniqueHostnames([ATS_RECORDING_DEFAULT_ALLOWED_HOST, ...extras]);
}

export function parseAtsRecordingUrl(raw: string, baseUrl?: URL): URL {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > ATS_RECORDING_MAX_URL_LENGTH) {
    throw rejectUrl('malformed');
  }
  let parsed: URL;
  try {
    parsed = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
  } catch {
    throw rejectUrl('malformed');
  }
  return assertSafeAtsRecordingUrl(parsed);
}

export function assertSafeAtsRecordingUrl(url: URL): URL {
  if (url.protocol !== 'https:') {
    throw rejectUrl('scheme');
  }
  if (url.username !== '' || url.password !== '') {
    throw rejectUrl('credentials');
  }
  if (url.port !== '' && url.port !== String(ATS_RECORDING_HTTPS_PORT)) {
    throw rejectUrl('port');
  }
  const hostname = stripIpv6Brackets(normalizeAtsRecordingHostname(url.hostname));
  if (isIP(url.hostname) || isIP(hostname) || isIP(stripIpv6Brackets(url.hostname))) {
    throw rejectUrl('ip_literal');
  }
  if (!hostname || !isExactAtsRecordingHostname(hostname)) {
    throw rejectUrl('malformed');
  }
  url.hostname = hostname;
  return url;
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']') && hostname.length > 2) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

export function assertAtsRecordingHostnameAllowed(
  hostname: string,
  allowedHosts: readonly string[],
): void {
  const normalized = normalizeAtsRecordingHostname(hostname);
  if (!allowedHosts.includes(normalized)) {
    throw rejectUrl('hostname');
  }
}

function uniqueHostnames(hostnames: readonly string[]): readonly string[] {
  return [...new Set(hostnames.map((value) => normalizeAtsRecordingHostname(value)))];
}

function rejectUrl(reason: string): AtsRecordingPermanentError {
  return new AtsRecordingPermanentError(`recording url rejected (${reason})`);
}
