/** Custom MIME for HTML5 drag of Drive file ids (Company/Personal folder scope). */
export const DRIVE_FILE_DRAG_MIME = 'application/x-nbos-drive-file-ids';

export type DriveFileDragPayload = { fileIds: readonly string[] };

export function stringifyDriveFileDragPayload(payload: DriveFileDragPayload): string {
  return JSON.stringify({ fileIds: [...payload.fileIds] });
}

export function parseDriveFileDragPayload(raw: string): DriveFileDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('fileIds' in parsed)) return null;
    const ids = (parsed as { fileIds: unknown }).fileIds;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) return null;
    return { fileIds: ids };
  } catch {
    return null;
  }
}

export function dataTransferHasDriveFileDrag(dataTransfer: DataTransfer): boolean {
  return [...dataTransfer.types].includes(DRIVE_FILE_DRAG_MIME);
}
