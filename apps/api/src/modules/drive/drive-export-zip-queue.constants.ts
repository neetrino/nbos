export const DRIVE_ZIP_EXPORT_QUEUE_NAME = 'drive.zip-export-jobs';

export const DRIVE_ZIP_EXPORT_JOB_NAME = 'drive.zip-export';

export interface DriveZipExportQueuePayload {
  jobId: string;
  actorId: string;
}
