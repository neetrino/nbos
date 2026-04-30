import type { InputJsonValue } from '@nbos/database';

export const REPORT_EXPORT_FORMATS = ['CSV', 'XLSX', 'PDF'] as const;
export const REPORT_EXPORT_OWNER_MODULES = ['FINANCE'] as const;

export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];
export type ReportExportOwnerModule = (typeof REPORT_EXPORT_OWNER_MODULES)[number];

export interface CreateReportExportJobDto {
  reportKey?: unknown;
  ownerModule?: unknown;
  format?: unknown;
  filters?: unknown;
}

export interface ParsedReportExportJobInput {
  reportKey: string;
  ownerModule: ReportExportOwnerModule;
  format: ReportExportFormat;
  filters?: InputJsonValue;
}
