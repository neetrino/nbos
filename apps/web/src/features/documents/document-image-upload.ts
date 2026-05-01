import { driveApi } from '@/lib/api/drive';
import { DOCUMENT_ATTACHMENT_MAX_BYTES } from '@/features/documents/document-upload.constants';

export async function uploadFileAssetForDocument(
  documentId: string,
  file: File,
  maxBytes: number = DOCUMENT_ATTACHMENT_MAX_BYTES,
): Promise<{ fileAssetId: string }> {
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }
  const contentType = file.type || 'application/octet-stream';
  const session = await driveApi.createUploadSession({
    fileName: file.name,
    contentType,
    entityType: 'DOCUMENT',
    entityId: documentId,
    sourceModule: 'DOCUMENTS',
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
    throw new Error(`Upload failed with status ${put.status}`);
  }
  const asset = await driveApi.completeUploadSession(session.sessionId, {
    sizeBytes: file.size,
  });
  return { fileAssetId: asset.id };
}
