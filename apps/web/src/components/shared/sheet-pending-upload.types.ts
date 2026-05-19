export type SheetPendingUploadStatus = 'uploading' | 'error';

export interface SheetPendingUpload {
  localId: string;
  displayName: string;
  previewUrl: string | null;
  status: SheetPendingUploadStatus;
}
