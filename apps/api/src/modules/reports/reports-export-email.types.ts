import type { InputJsonValue } from '@nbos/database';

export interface ReportExportEmailFile {
  id: string;
  displayName: string;
  mimeType: string | null;
  storageKey: string | null;
  storageProvider: string;
  sizeBytes: bigint | number | null;
}

export interface ReportExportEmailJob {
  id: string;
  reportKey: string;
  reportTitle: string;
  format: string;
  status: string;
  fileAssetId: string | null;
  filters: InputJsonValue | null;
  fileAsset: ReportExportEmailFile | null;
}

export interface ReportExportEmailSchedule {
  id: string;
  ownerId: string;
  recipientEmails: string[];
  recipientRoles: string[];
  reportKey: string;
}
