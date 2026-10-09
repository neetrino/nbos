import { driveApi } from '@/lib/api/drive';

export const MESSENGER_COMPOSER_FILE_MAX_COUNT = 10;
export const MESSENGER_COMPOSER_FILE_MAX_BYTES = 25 * 1024 * 1024;

const OCTET_STREAM = 'application/octet-stream';

/** Uploads one composer file onto the signed-in employee and returns the Drive asset id. */
export async function uploadMessengerComposerFile(employeeId: string, file: File): Promise<string> {
  if (file.size > MESSENGER_COMPOSER_FILE_MAX_BYTES) {
    throw new Error('File is too large');
  }
  const contentType = file.type || OCTET_STREAM;
  const session = await driveApi.createUploadSession({
    fileName: file.name,
    contentType,
    displayName: file.name,
    entityType: 'EMPLOYEE',
    entityId: employeeId,
    sourceModule: 'MESSENGER',
  });
  const put = await fetch(session.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });
  if (!put.ok) {
    await driveApi
      .failUploadSession(session.sessionId, `upload_http_${put.status}`)
      .catch(() => {});
    throw new Error('Upload failed');
  }
  const asset = await driveApi.completeUploadSession(session.sessionId, { sizeBytes: file.size });
  return asset.id;
}
