export const REPORT_EXPORT_QUEUE_NAME = 'reports.export-jobs';
export const REPORT_EXPORT_JOB_NAME = 'reports.export';

export interface ReportExportQueuePayload {
  jobId: string;
  actorId: string;
}
