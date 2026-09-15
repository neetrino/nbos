import { driveApi, type FileAsset } from '@/lib/api/drive';

export const DRIVE_FILE_PREVIEW_UNAVAILABLE = 'Preview unavailable.';

/**
 * URL to open a Drive file in the browser: external source, else signed preview.
 */
export async function resolveDriveFileOpenUrl(file: FileAsset): Promise<string> {
  if (file.externalUrl) return file.externalUrl;
  const { url } = await driveApi.getFileAssetPreviewUrl(file.id);
  if (!url) {
    throw new Error(DRIVE_FILE_PREVIEW_UNAVAILABLE);
  }
  return url;
}

export async function openDriveFileAssetInBrowser(file: FileAsset): Promise<void> {
  const url = await resolveDriveFileOpenUrl(file);
  window.open(url, '_blank', 'noopener,noreferrer');
}
