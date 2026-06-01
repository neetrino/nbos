import { BadRequestException } from '@nestjs/common';

/** Authoritative upload size cap (enforced server-side from the stored object). */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const MAX_UPLOAD_MB = Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024));

/**
 * Executable / script extensions blocked on upload (malware + stored-XSS vectors).
 * NBOS Drive stores business documents, not runnable artifacts.
 */
const BLOCKED_EXTENSIONS = new Set([
  'exe',
  'msi',
  'bat',
  'cmd',
  'com',
  'scr',
  'pif',
  'cpl',
  'msc',
  'sh',
  'bash',
  'ps1',
  'vbs',
  'vbe',
  'js',
  'jse',
  'wsf',
  'wsh',
  'jar',
  'app',
  'dll',
  'deb',
  'dmg',
  'apk',
  'html',
  'htm',
  'svg',
]);

/** Rejects uploads whose filename extension is a known executable / scriptable type. */
export function assertUploadFileNameAllowed(fileName: string): void {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return;
  const ext = fileName.slice(dotIndex + 1).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(`File type ".${ext}" is not allowed.`);
  }
}

/** Rejects uploads larger than {@link MAX_UPLOAD_BYTES}. Ignores missing/invalid sizes. */
export function assertUploadSizeWithinLimit(sizeBytes: number | undefined | null): void {
  if (typeof sizeBytes !== 'number' || !Number.isFinite(sizeBytes)) return;
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new BadRequestException(`File exceeds the maximum allowed size of ${MAX_UPLOAD_MB} MB.`);
  }
}
