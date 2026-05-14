export interface DriveZipManifestEntry {
  fileId: string;
  exportPath: string;
  purpose?: string | null;
  skippedReason?: string;
}

export function buildDriveZipExportManifestPayload(params: {
  jobId: string;
  requesterId: string;
  generatedAt: string;
  entries: DriveZipManifestEntry[];
}): Record<string, unknown> {
  return {
    exportKind: 'drive.selection_zip',
    jobId: params.jobId,
    requestedById: params.requesterId,
    generatedAt: params.generatedAt,
    files: params.entries,
  };
}
