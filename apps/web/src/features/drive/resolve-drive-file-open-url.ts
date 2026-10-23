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

/**
 * Signed URL that asks the browser to save the file. External files have no
 * storage disposition and return their source URL.
 */
export async function resolveDriveFileDownloadUrl(file: FileAsset): Promise<string> {
  if (file.externalUrl) return file.externalUrl;
  const { url } = await driveApi.getFileAssetPreviewUrl(file.id, { disposition: 'attachment' });
  if (!url) {
    throw new Error(DRIVE_FILE_PREVIEW_UNAVAILABLE);
  }
  return url;
}

/**
 * Starts a download from the same user click. The blank tab is opened before
 * the signed URL request so the browser still treats it as a user gesture.
 */
export async function downloadDriveFileAsset(file: FileAsset): Promise<void> {
  if (file.externalUrl) {
    window.open(file.externalUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  const popup = window.open('', '_blank');
  if (popup) popup.opener = null;
  try {
    const url = await resolveDriveFileDownloadUrl(file);
    if (popup) {
      popup.location.href = url;
      return;
    }
    triggerAnchorDownload(url);
  } catch (error) {
    popup?.close();
    throw error;
  }
}

function triggerAnchorDownload(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
