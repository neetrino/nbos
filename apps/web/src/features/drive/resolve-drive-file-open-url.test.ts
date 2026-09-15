import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileAsset } from '@/lib/api/drive';
import { driveApi } from '@/lib/api/drive';
import {
  DRIVE_FILE_PREVIEW_UNAVAILABLE,
  resolveDriveFileOpenUrl,
} from './resolve-drive-file-open-url';

vi.mock('@/lib/api/drive', () => ({
  driveApi: {
    getFileAssetPreviewUrl: vi.fn(),
  },
}));

const getPreviewUrl = vi.mocked(driveApi.getFileAssetPreviewUrl);

function fileAsset(overrides: Partial<FileAsset>): FileAsset {
  return {
    id: 'file-1',
    displayName: 'photo.jpg',
    originalName: 'photo.jpg',
    fileType: 'IMAGE',
    purpose: 'TASK_ATTACHMENT',
    sourceModule: 'TASKS',
    status: 'APPROVED',
    visibility: 'INTERNAL',
    confidentiality: 'INTERNAL',
    storageProvider: 'R2',
    storageKey: 'tasks/photo.jpg',
    externalUrl: null,
    mimeType: 'image/jpeg',
    sizeBytes: 12,
    checksum: null,
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    versions: [],
    links: [],
    ...overrides,
  };
}

describe('resolveDriveFileOpenUrl', () => {
  beforeEach(() => {
    getPreviewUrl.mockReset();
  });

  it('uses the external URL when present', async () => {
    const url = await resolveDriveFileOpenUrl(
      fileAsset({ externalUrl: 'https://example.test/photo.jpg' }),
    );
    expect(url).toBe('https://example.test/photo.jpg');
    expect(getPreviewUrl).not.toHaveBeenCalled();
  });

  it('loads a signed preview URL for stored Drive files', async () => {
    getPreviewUrl.mockResolvedValue({
      url: 'https://cdn.test/signed-photo.jpg',
      mimeType: 'image/jpeg',
    });
    const url = await resolveDriveFileOpenUrl(fileAsset({ externalUrl: null }));
    expect(url).toBe('https://cdn.test/signed-photo.jpg');
    expect(getPreviewUrl).toHaveBeenCalledWith('file-1');
  });

  it('rejects when preview URL is missing', async () => {
    getPreviewUrl.mockResolvedValue({ url: '', mimeType: null });
    await expect(resolveDriveFileOpenUrl(fileAsset({}))).rejects.toThrow(
      DRIVE_FILE_PREVIEW_UNAVAILABLE,
    );
  });
});
