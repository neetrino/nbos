import type { InputJsonValue } from '@nbos/database';
import type { ReportScheduleFrequency } from './reports-schedule-recurrence';

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

export interface CreateReportScheduleDto extends CreateReportExportJobDto {
  recipientEmails?: unknown;
  scheduleLabel?: unknown;
  frequency?: unknown;
  timezone?: unknown;
  timeOfDay?: unknown;
  startDate?: unknown;
  dayOfWeek?: unknown;
  dayOfMonth?: unknown;
}

export interface CreateSavedReportViewDto {
  reportKey?: unknown;
  ownerModule?: unknown;
  name?: unknown;
  filters?: unknown;
}

export interface ParsedReportExportJobInput {
  reportKey: string;
  ownerModule: ReportExportOwnerModule;
  format: ReportExportFormat;
  filters?: InputJsonValue;
}

export interface ParsedReportScheduleInput extends ParsedReportExportJobInput {
  recipientEmails: string[];
  scheduleLabel: string;
  frequency: ReportScheduleFrequency;
  timezone: string;
  timeOfDay: string;
  startDate: Date;
  dayOfWeek?: number;
  dayOfMonth?: number;
  nextRunAt: Date;
}

export interface ParsedSavedReportViewInput {
  reportKey: string;
  ownerModule: ReportExportOwnerModule;
  name: string;
  filters?: InputJsonValue;
}

export type ReportDataQualitySeverity = 'INFO' | 'WARNING';

export interface ReportDataQualityWarning {
  reportKey: string;
  reportTitle: string;
  ownerModule: ReportExportOwnerModule;
  severity: ReportDataQualitySeverity;
  code: string;
  message: string;
  sourceEndpoints: string[];
}
