import {
  ATS_CALL_RECORDING_DEFAULT_EXT,
  ATS_CALL_RECORDING_DEFAULT_MIME,
} from './ats-call-recording.constants';

export const ATS_RECORDING_AUDIO_MIME_PREFIX = 'audio/';
export const ATS_RECORDING_OCTET_STREAM = 'application/octet-stream';
export const ATS_RECORDING_MPEG_MIME = 'audio/mpeg';
export const ATS_RECORDING_MIME_SNIFF_BYTES = 16;

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

const MIME_BY_EXT: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': ATS_RECORDING_MPEG_MIME,
  '.ogg': 'audio/ogg',
  '.webm': 'audio/webm',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
};

export function normalizeMediaType(value: string | null | undefined): string {
  return value?.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function recordingExtensionForMime(mimeType: string): string {
  return EXT_BY_MIME[normalizeMediaType(mimeType)] ?? ATS_CALL_RECORDING_DEFAULT_EXT;
}

export function resolveAtsRecordingMime(input: {
  contentType: string | null;
  contentDisposition: string | null;
  prefix: Uint8Array;
}): string {
  const headerMime = audioMimeFromContentType(input.contentType);
  if (headerMime) return headerMime;
  return (
    sniffAudioMime(input.prefix) ??
    audioMimeFromContentDisposition(input.contentDisposition) ??
    ATS_CALL_RECORDING_DEFAULT_MIME
  );
}

/** Stored ATS files were often octet-stream MP3; browsers need an audio MIME to show duration. */
export function recordingPlaybackMime(storedMime: string | null | undefined): string {
  const normalized = normalizeMediaType(storedMime);
  if (normalized.startsWith(ATS_RECORDING_AUDIO_MIME_PREFIX)) return normalized;
  return ATS_RECORDING_MPEG_MIME;
}

export function sniffAudioMime(prefix: Uint8Array): string | null {
  if (startsWithAscii(prefix, 'ID3') || isMpegFrameSync(prefix)) return ATS_RECORDING_MPEG_MIME;
  if (startsWithAscii(prefix, 'RIFF') && startsWithAscii(prefix.subarray(8), 'WAVE')) {
    return 'audio/wav';
  }
  if (startsWithAscii(prefix, 'OggS')) return 'audio/ogg';
  return null;
}

function audioMimeFromContentType(contentType: string | null): string | null {
  const normalized = normalizeMediaType(contentType);
  if (!normalized.startsWith(ATS_RECORDING_AUDIO_MIME_PREFIX)) return null;
  return normalized;
}

function audioMimeFromContentDisposition(header: string | null): string | null {
  const filename = filenameFromContentDisposition(header);
  if (!filename) return null;
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return null;
  return MIME_BY_EXT[filename.slice(dot).toLowerCase()] ?? null;
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const encoded = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/iu.exec(header);
  if (encoded?.[1]) return decodeUriComponentSafe(encoded[1].trim().replaceAll('"', ''));
  const quoted = /filename="([^"]+)"/iu.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/iu.exec(header);
  if (!plain?.[1]) return null;
  return plain[1].trim().replaceAll('"', '');
}

function decodeUriComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function startsWithAscii(bytes: Uint8Array, ascii: string): boolean {
  if (bytes.length < ascii.length) return false;
  for (let i = 0; i < ascii.length; i += 1) {
    if (bytes[i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
}

function isMpegFrameSync(prefix: Uint8Array): boolean {
  return prefix.length >= 2 && prefix[0] === 0xff && (prefix[1] & 0xe0) === 0xe0;
}
