import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';
import {
  ATS_RECORDING_AUDIO_MIME_PREFIX,
  ATS_RECORDING_OCTET_STREAM,
  normalizeMediaType,
  recordingExtensionForMime,
} from './ats-recording-mime';

export { recordingExtensionForMime };

export function classifyAtsRecordingHttpStatus(status: number): 'ok' | 'transient' | 'permanent' {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 401 || status === 403 || status === 400 || status === 410) {
    return 'permanent';
  }
  return 'transient';
}

export function throwForAtsRecordingHttpStatus(status: number, source: string): never {
  const kind = classifyAtsRecordingHttpStatus(status);
  const message = `${source} HTTP ${status}`;
  if (kind === 'permanent') {
    throw new AtsRecordingPermanentError(message);
  }
  throw new AtsRecordingTransientError(message);
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export function isAtsRecordingRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

export function parseAtsRecordingContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function isLikelyAudioContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const normalized = normalizeMediaType(contentType);
  if (!normalized) return true;
  if (normalized.startsWith(ATS_RECORDING_AUDIO_MIME_PREFIX)) return true;
  return normalized === ATS_RECORDING_OCTET_STREAM;
}
