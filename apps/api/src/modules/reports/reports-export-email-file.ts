import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { DriveR2Client } from '../drive/drive-r2.client';
import type { ReportExportEmailFile } from './reports-export-email.types';

export const REPORT_EMAIL_ATTACHMENT_TIMEOUT_MS = 20_000;
export const MAX_REPORT_EMAIL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export interface ReportEmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export function canAttachReportExportFile(file: ReportExportEmailFile | null): boolean {
  if (!file?.storageKey || file.storageProvider !== 'R2') return false;
  const size = file.sizeBytes == null ? 0 : Number(file.sizeBytes);
  return size <= MAX_REPORT_EMAIL_ATTACHMENT_BYTES;
}

export async function loadReportExportAttachment(
  r2: DriveR2Client,
  file: ReportExportEmailFile,
): Promise<ReportEmailAttachment | null> {
  if (!canAttachReportExportFile(file) || !file.storageKey) return null;
  const response = await r2
    .ensureS3()
    .send(new GetObjectCommand({ Bucket: r2.bucket, Key: file.storageKey }), {
      abortSignal: AbortSignal.timeout(REPORT_EMAIL_ATTACHMENT_TIMEOUT_MS),
    });
  const content = await bufferFromBody(response.Body as AsyncIterable<Uint8Array> | undefined);
  if (!content) return null;
  return {
    filename: file.displayName,
    content: content.toString('base64'),
    contentType: file.mimeType ?? 'application/octet-stream',
  };
}

async function bufferFromBody(body: AsyncIterable<Uint8Array> | undefined): Promise<Buffer | null> {
  if (!body) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
