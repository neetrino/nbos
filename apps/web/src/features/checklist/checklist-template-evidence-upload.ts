import { driveApi } from '@/lib/api/drive';
import { DOCUMENT_ATTACHMENT_MAX_BYTES } from '@/features/documents/document-upload.constants';

/** Max bytes for checklist template evidence file uploads (same cap as document attachments). */
export const CHECKLIST_TEMPLATE_EVIDENCE_MAX_BYTES = DOCUMENT_ATTACHMENT_MAX_BYTES;

export const CHECKLIST_EVIDENCE_FILE_ACCEPT: Record<
  'FILE_LINK' | 'IMAGE_LINK' | 'DOCUMENT_LINK',
  string
> = {
  FILE_LINK: '*/*',
  IMAGE_LINK: 'image/*',
  DOCUMENT_LINK:
    'application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx',
};

/**
 * Uploads a file to Drive linked to the checklist template (draft editor).
 * Returns the new `FileAsset` id to store in `evidenceValue`.
 */
export async function uploadEvidenceFileForChecklistTemplate(
  templateId: string,
  file: File,
  maxBytes: number = CHECKLIST_TEMPLATE_EVIDENCE_MAX_BYTES,
): Promise<{ fileAssetId: string }> {
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }
  const contentType = file.type || 'application/octet-stream';
  const session = await driveApi.createUploadSession({
    fileName: file.name,
    contentType,
    entityType: 'CHECKLIST_TEMPLATE',
    entityId: templateId,
    sourceModule: 'CHECKLIST_TEMPLATES',
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
