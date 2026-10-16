import { describe, expect, it } from 'vitest';
import { canSaveMailAttachment } from './mail-attachment-download';

describe('canSaveMailAttachment', () => {
  it('allows a stored file', () => {
    expect(canSaveMailAttachment({ downloadStatus: 'READY', fileAssetId: 'file-1' })).toBe(true);
  });

  it('waits until the file is stored', () => {
    expect(canSaveMailAttachment({ downloadStatus: 'PENDING', fileAssetId: null })).toBe(false);
    expect(canSaveMailAttachment({ downloadStatus: 'FAILED', fileAssetId: null })).toBe(false);
    expect(canSaveMailAttachment({ downloadStatus: 'READY', fileAssetId: null })).toBe(false);
  });
});
