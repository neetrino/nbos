import { driveApi } from '@/lib/api/drive';
import { FALLBACK_MIME_TYPE } from './drive-options';
import type { DriveLibraryOption } from './drive-options';
import { getDriveClientUploadDisplayName } from './drive-client-upload-display-name';
import { buildDriveLibraryUploadSessionFields } from './drive-library-upload-defaults';
import { DRIVE_ENTITY_UPLOAD_CONCURRENCY } from './drive-entity-upload.constants';

export type DriveEntityUploadLink = { entityType: string; entityId: string };

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item === undefined) continue;
      await worker(item, index);
    }
  });
  await Promise.all(runners);
}

/**
 * Browser upload: presigned PUT directly to storage, then complete session on API.
 */
export async function uploadOneDriveFileToEntity(
  file: File,
  link: DriveEntityUploadLink,
  library: DriveLibraryOption,
  options?: { purpose?: string },
): Promise<void> {
  const meta = buildDriveLibraryUploadSessionFields(library, options?.purpose);
  const contentType = file.type || FALLBACK_MIME_TYPE;
  const displayName = getDriveClientUploadDisplayName(file);
  const session = await driveApi.createUploadSession({
    fileName: file.name,
    contentType,
    displayName,
    entityType: link.entityType,
    entityId: link.entityId,
    sourceModule: meta.sourceModule,
    purpose: meta.purpose,
    visibility: meta.visibility,
    confidentiality: 'CONFIDENTIAL',
  });
  const putResponse = await fetch(session.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });
  if (!putResponse.ok) {
    throw new Error(`Storage upload failed (${putResponse.status})`);
  }
  await driveApi.completeUploadSession(session.sessionId, { sizeBytes: file.size });
}

/**
 * Uploads files in parallel (session + PUT + complete per file, limited concurrency).
 */
export async function uploadDriveFilesToEntity(
  files: readonly File[],
  link: DriveEntityUploadLink,
  library: DriveLibraryOption,
  options?: { purpose?: string },
): Promise<void> {
  await runWithConcurrency(files, DRIVE_ENTITY_UPLOAD_CONCURRENCY, async (file) => {
    await uploadOneDriveFileToEntity(file, link, library, options);
  });
}
