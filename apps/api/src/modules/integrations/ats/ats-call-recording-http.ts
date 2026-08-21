import { ATS_CALL_RECORDING_DEFAULT_EXT } from './ats-call-recording.constants';
import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';

const AUDIO_MIME_PREFIX = 'audio/';
const OCTET_STREAM = 'application/octet-stream';

const EXT_BY_MIME: Record<string, string> = {
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
};

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

export function recordingExtensionForMime(mimeType: string): string {
  const normalized = mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  return EXT_BY_MIME[normalized] ?? ATS_CALL_RECORDING_DEFAULT_EXT;
}

export function isLikelyAudioContentType(contentType: string | null): boolean {
  if (!contentType) return true;
  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!normalized) return true;
  if (normalized.startsWith(AUDIO_MIME_PREFIX)) return true;
  if (normalized === OCTET_STREAM) return true;
  return false;
}
