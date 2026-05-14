import { driveApi } from '@/lib/api/drive';
import { FALLBACK_MIME_TYPE } from './drive-options';
import type { DriveLibraryOption } from './drive-options';
import { getDriveClientUploadDisplayName } from './drive-client-upload-display-name';
import { buildDriveLibraryUploadSessionFields } from './drive-library-upload-defaults';

export type DriveEntityUploadLink = { entityType: string; entityId: string };

/**
 * Uploads one or more files to Drive and links them to the given entity (same contract as Library upload).
 */
export async function uploadDriveFilesToEntity(
  files: readonly File[],
  link: DriveEntityUploadLink,
  library: DriveLibraryOption,
): Promise<void> {
  const meta = buildDriveLibraryUploadSessionFields(library);
  for (const file of files) {
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
    await fetch(session.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    await driveApi.completeUploadSession(session.sessionId, { sizeBytes: file.size });
  }
}
