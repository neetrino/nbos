import { slugifySegment } from './drive-storage-slug';
import { purposeSlugForFilename } from './drive-storage-home-purpose';
import type { FilePurposeEnum } from '@nbos/database';

function formatUploadDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fileExtension(displayName: string): string {
  const base = displayName.split(/[/\\]/).pop() ?? displayName;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot).toLowerCase();
}

function baseNameWithoutExt(displayName: string): string {
  const base = displayName.split(/[/\\]/).pop() ?? displayName;
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
}

function shortFileId(fileAssetId: string): string {
  return fileAssetId.replace(/-/g, '').slice(0, 12);
}

export type StorageHomeFilenameParams = {
  uploadedAt?: Date;
  purpose?: FilePurposeEnum | null;
  displayName: string;
  fileAssetId: string;
  versionNumber?: number;
};

/**
 * Canon object name: `YYYY-MM-DD__purpose__short-name__fileId__v{n}.ext`
 */
export function buildStorageHomeFileName(params: StorageHomeFilenameParams): string {
  const date = formatUploadDate(params.uploadedAt ?? new Date());
  const purpose = purposeSlugForFilename(params.purpose);
  const shortName = slugifySegment(baseNameWithoutExt(params.displayName), 40);
  const ext = fileExtension(params.displayName);
  const idPart = shortFileId(params.fileAssetId);
  const version = params.versionNumber ?? 1;
  return `${date}__${purpose}__${shortName}__${idPart}__v${version}${ext}`;
}
