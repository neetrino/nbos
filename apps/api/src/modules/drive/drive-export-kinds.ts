import { BadRequestException } from '@nestjs/common';

/** ZIP export modes supported by Drive (doc 06 §5). */
export const DRIVE_ZIP_EXPORT_KINDS = [
  'drive.selection_zip',
  'drive.project_zip',
  'drive.product_zip',
  'drive.client_zip',
  'drive.finance_zip',
  'drive.task_attachments_zip',
  'drive.offer_zip',
  'drive.meeting_zip',
  'drive.call_zip',
  'drive.partner_zip',
  'drive.full_backup_zip',
] as const;

export type DriveZipExportKind = (typeof DRIVE_ZIP_EXPORT_KINDS)[number];

const ALLOWED = new Set<string>(DRIVE_ZIP_EXPORT_KINDS);

export function normalizeDriveZipExportKind(value: string | undefined): DriveZipExportKind {
  const kind = value?.trim() || 'drive.selection_zip';
  if (!ALLOWED.has(kind)) {
    throw new BadRequestException(
      `exportKind must be one of: ${DRIVE_ZIP_EXPORT_KINDS.join(', ')}`,
    );
  }
  return kind as DriveZipExportKind;
}

export interface DriveZipExportParams {
  projectId?: string;
  productId?: string;
  companyId?: string;
  contactId?: string;
  taskId?: string;
  dealId?: string;
  partnerId?: string;
}

export function parseDriveZipExportParams(raw: unknown): DriveZipExportParams {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const pick = (key: keyof DriveZipExportParams) =>
    typeof o[key] === 'string' ? (o[key] as string).trim() : undefined;
  return {
    projectId: pick('projectId'),
    productId: pick('productId'),
    companyId: pick('companyId'),
    contactId: pick('contactId'),
    taskId: pick('taskId'),
    dealId: pick('dealId'),
    partnerId: pick('partnerId'),
  };
}
