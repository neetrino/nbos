import { describe, expect, it, vi } from 'vitest';
import { collectFileAssetR2StorageKeys, deleteR2StorageKeys } from './drive-r2-storage-purge.ops';

describe('collectFileAssetR2StorageKeys', () => {
  it('returns empty for non-R2 providers', () => {
    expect(
      collectFileAssetR2StorageKeys({
        storageProvider: 'EXTERNAL_URL',
        storageKey: 'key',
        versions: [{ storageKey: 'v1' }],
      }),
    ).toEqual([]);
  });

  it('deduplicates root and version keys', () => {
    expect(
      collectFileAssetR2StorageKeys({
        storageProvider: 'R2',
        storageKey: ' nbos/tenant/a.pdf ',
        versions: [{ storageKey: 'nbos/tenant/a.pdf' }, { storageKey: 'nbos/tenant/v2.pdf' }],
      }),
    ).toEqual(['nbos/tenant/a.pdf', 'nbos/tenant/v2.pdf']);
  });
});

describe('deleteR2StorageKeys', () => {
  it('returns zero counts when no keys are provided', async () => {
    const result = await deleteR2StorageKeys(
      { ensureS3: () => ({ send: vi.fn() }), bucket: 'b' } as never,
      [],
      { warn: vi.fn() },
    );
    expect(result).toEqual({ deleted: 0, failed: 0 });
  });
});
