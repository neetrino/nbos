import {
  driveApi,
  type CreateDriveZipExportInput,
  type DriveZipExportJobSummary,
} from '@/lib/api/drive';

const DRIVE_ZIP_EXPORT_POLL_INTERVAL_MS = 900;
const DRIVE_ZIP_EXPORT_POLL_MAX_ATTEMPTS = 180;

/**
 * Creates a ZIP export job, polls until terminal state, and opens download when completed.
 */
export async function runDriveZipExportJob(
  input: CreateDriveZipExportInput,
): Promise<DriveZipExportJobSummary> {
  const job = await driveApi.createDriveZipExport(input);
  for (let attempt = 0; attempt < DRIVE_ZIP_EXPORT_POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, DRIVE_ZIP_EXPORT_POLL_INTERVAL_MS));
    const row = await driveApi.getDriveZipExportJob(job.id);
    if (row.status === 'COMPLETED' && row.fileAsset?.id) {
      const { url } = await driveApi.getFileAssetPreviewUrl(row.fileAsset.id);
      window.open(url, '_blank', 'noopener,noreferrer');
      return row;
    }
    if (row.status === 'FAILED') {
      throw new Error(row.errorMessage ?? 'ZIP export failed');
    }
    if (row.status === 'CANCELLED') {
      throw new Error('ZIP export was cancelled');
    }
  }
  throw new Error('ZIP export is taking longer than expected. Try again in a minute.');
}
