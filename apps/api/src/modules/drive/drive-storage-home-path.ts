import { sanitizeUploadBaseName } from './drive-upload-path';
import {
  buildStorageHomeFileName,
  type StorageHomeFilenameParams,
} from './drive-storage-home-filename';

export const NBOS_STORAGE_ROOT = 'nbos';

export function buildTenantFilesPrefix(organizationId: string): string {
  return `${NBOS_STORAGE_ROOT}/tenants/${organizationId}/files/`;
}

export function buildStorageHomeKey(
  organizationId: string,
  contextPath: string,
  fileName: string,
): string {
  const ctx = contextPath.replace(/^\/+|\/+$/g, '');
  return `${buildTenantFilesPrefix(organizationId)}${ctx}/${fileName}`;
}

export function buildStorageHomeKeyFromParams(
  organizationId: string,
  contextPath: string,
  filenameParams: StorageHomeFilenameParams,
): string {
  return buildStorageHomeKey(organizationId, contextPath, buildStorageHomeFileName(filenameParams));
}

export function buildVersionStagingKey(
  organizationId: string,
  fileAssetId: string,
  uploadId: string,
  fileName: string,
): string {
  const safe = sanitizeUploadBaseName(fileName);
  return `${NBOS_STORAGE_ROOT}/tenants/${organizationId}/_staging/versions/${fileAssetId}/${uploadId}/${safe}`;
}

export function versionStagingPrefix(organizationId: string, fileAssetId: string): string {
  return `${NBOS_STORAGE_ROOT}/tenants/${organizationId}/_staging/versions/${fileAssetId}/`;
}

export function dirnameStorageKey(storageKey: string): string | null {
  const idx = storageKey.lastIndexOf('/');
  if (idx <= 0) return null;
  return storageKey.slice(0, idx);
}
