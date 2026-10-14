import { driveApi } from '@/lib/api/drive';
import {
  MAIL_COMPOSE_ATTACHMENT_MAX_BYTES,
  MAIL_COMPOSE_UPLOAD_ENTITY_ID,
  MAIL_COMPOSE_UPLOAD_ENTITY_TYPE,
} from './mail-compose-attachment.constants';

/** Uploads one compose file to Drive and returns its FileAsset id. */
export async function uploadMailComposeFile(file: File): Promise<string> {
  if (file.size > MAIL_COMPOSE_ATTACHMENT_MAX_BYTES) {
    throw new Error('File exceeds the 25 MB mail attachment limit.');
  }
  const contentType = file.type || 'application/octet-stream';
  const session = await driveApi.createUploadSession({
    fileName: file.name,
    contentType,
    entityType: MAIL_COMPOSE_UPLOAD_ENTITY_TYPE,
    entityId: MAIL_COMPOSE_UPLOAD_ENTITY_ID,
    purpose: 'OTHER',
    sourceModule: 'MAIL',
    visibility: 'RESTRICTED',
  });
  const put = await fetch(session.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  });
  if (!put.ok) {
    await driveApi
      .failUploadSession(session.sessionId, `upload_http_${put.status}`)
      .catch(() => undefined);
    throw new Error('File could not be uploaded.');
  }
  const asset = await driveApi.completeUploadSession(session.sessionId, {
    sizeBytes: file.size,
  });
  return asset.id;
}
