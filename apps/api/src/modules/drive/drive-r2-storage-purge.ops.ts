import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { Logger } from '@nestjs/common';
import type { DriveR2Client } from './drive-r2.client';

export interface FileAssetStoragePurgeRow {
  storageProvider: string;
  storageKey: string | null;
  versions: Array<{ storageKey: string | null }>;
}

/** Collects distinct R2 object keys for a file asset and its versions. */
export function collectFileAssetR2StorageKeys(row: FileAssetStoragePurgeRow): string[] {
  if (row.storageProvider !== 'R2') return [];
  const keys = new Set<string>();
  const rootKey = row.storageKey?.trim();
  if (rootKey) keys.add(rootKey);
  for (const version of row.versions) {
    const versionKey = version.storageKey?.trim();
    if (versionKey) keys.add(versionKey);
  }
  return [...keys];
}

/** Best-effort R2 object deletion; returns counts for observability. */
export async function deleteR2StorageKeys(
  r2: DriveR2Client,
  keys: readonly string[],
  logger: Pick<Logger, 'warn'>,
): Promise<{ deleted: number; failed: number }> {
  if (keys.length === 0) return { deleted: 0, failed: 0 };

  let deleted = 0;
  let failed = 0;
  try {
    const s3 = r2.ensureS3();
    for (const key of keys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
        deleted += 1;
      } catch {
        failed += 1;
        logger.warn(`Failed to delete R2 object: ${key}`);
      }
    }
  } catch {
    return { deleted: 0, failed: keys.length };
  }
  return { deleted, failed };
}
