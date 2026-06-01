import { BadRequestException } from '@nestjs/common';
import {
  buildTenantFilesPrefix,
  NBOS_STORAGE_ROOT,
  versionStagingPrefix,
} from '../../modules/drive/drive-storage-home-path';

const TRAVERSAL_OR_NULL = /\.\.|\\|\0/;

/** Rejects path traversal markers in a storage path segment or key. */
export function assertNoPathTraversal(value: string, label: string): void {
  if (!value.trim() || TRAVERSAL_OR_NULL.test(value) || value.includes('//')) {
    throw new BadRequestException(`Invalid ${label}`);
  }
}

/** Normalizes and validates a storage context path (no `.` / `..` segments). */
export function normalizeSafeContextPath(contextPath: string): string {
  const normalized = contextPath.replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    return normalized;
  }
  for (const segment of normalized.split('/')) {
    if (!segment || segment === '.' || segment === '..') {
      throw new BadRequestException('Invalid storage context path');
    }
    assertNoPathTraversal(segment, 'storage context path');
  }
  return normalized;
}

/**
 * Ensures an R2 object key stays within the tenant files tree or version staging
 * prefix for the given file asset (when completing a version upload).
 */
export function assertStorageKeyInTenantScope(
  storageKey: string,
  organizationId: string,
  fileAssetId?: string,
): void {
  assertNoPathTraversal(storageKey, 'storageKey');

  const tenantPrefix = buildTenantFilesPrefix(organizationId);
  const allowedPrefixes = [tenantPrefix, `${NBOS_STORAGE_ROOT}/tenants/${organizationId}/`];
  if (fileAssetId) {
    allowedPrefixes.push(versionStagingPrefix(organizationId, fileAssetId));
  }

  if (!allowedPrefixes.some((prefix) => storageKey.startsWith(prefix))) {
    throw new BadRequestException('storageKey is outside the allowed tenant scope');
  }
}
