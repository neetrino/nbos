import { ServiceUnavailableException } from '@nestjs/common';

const SYNC_FALLBACK_ENV = 'REPORT_EXPORT_SYNC_FALLBACK';

/** User-facing message when neither BullMQ nor dev fallback is configured. */
export const REPORT_EXPORT_DISPATCH_ERROR_MESSAGE =
  'Report exports require REDIS_URL (BullMQ worker). For local development only, set REPORT_EXPORT_SYNC_FALLBACK=true. Do not enable sync fallback in production.';

export function isReportExportSyncFallbackEnabled(): boolean {
  return process.env[SYNC_FALLBACK_ENV] === 'true';
}

export function isReportExportDispatchAvailable(queueAvailable: boolean): boolean {
  return queueAvailable || isReportExportSyncFallbackEnabled();
}

/** Non-HTTP callers (e.g. cron) use this to fail before creating DB rows. */
export function getReportExportDispatchBlockedReason(queueAvailable: boolean): string | null {
  if (isReportExportDispatchAvailable(queueAvailable)) return null;
  return REPORT_EXPORT_DISPATCH_ERROR_MESSAGE;
}

export function assertReportExportDispatchForHttp(queueAvailable: boolean): void {
  if (!isReportExportDispatchAvailable(queueAvailable)) {
    throw new ServiceUnavailableException(REPORT_EXPORT_DISPATCH_ERROR_MESSAGE);
  }
}
