import type { FileAsset } from '@/lib/api/drive';

export function buildDriveFileHref(fileId: string): string {
  return `/drive?fileId=${encodeURIComponent(fileId)}`;
}

export function buildDriveFileAbsoluteUrl(file: FileAsset): string {
  if (typeof window === 'undefined') return buildDriveFileHref(file.id);
  return new URL(buildDriveFileHref(file.id), window.location.origin).toString();
}
