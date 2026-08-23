import { describe, expect, it } from 'vitest';
import { deleteOwnedOrphanObject } from './drive-artifact-orphan.ops';
import { InMemoryDriveArtifactStorage } from './in-memory-drive-artifact-storage';

describe('deleteOwnedOrphanObject', () => {
  it('does not delete an object that a FileAsset still references', async () => {
    const storage = new InMemoryDriveArtifactStorage();
    await storage.putObject('key-1', new Uint8Array([1]), 'text/plain');
    const result = await deleteOwnedOrphanObject({
      db: {
        fileArtifactOperation: {
          findUnique: async () => ({
            id: 'op-1',
            status: 'FAILED',
            storageKey: 'key-1',
          }),
        },
        fileAsset: { findFirst: async () => ({ id: 'file-1' }) },
        fileVersion: { findFirst: async () => null },
      } as never,
      storage,
      operationId: 'op-1',
    });
    expect(result).toBe('skipped');
    expect(storage.has('key-1')).toBe(true);
  });

  it('does not delete from a non-terminal operation even if HeadObject succeeds', async () => {
    const storage = new InMemoryDriveArtifactStorage();
    await storage.putObject('key-2', new Uint8Array([1]), 'text/plain');
    const result = await deleteOwnedOrphanObject({
      db: {
        fileArtifactOperation: {
          findUnique: async () => ({
            id: 'op-2',
            status: 'OBJECT_VERIFIED',
            storageKey: 'key-2',
          }),
        },
        fileAsset: { findFirst: async () => null },
        fileVersion: { findFirst: async () => null },
      } as never,
      storage,
      operationId: 'op-2',
    });
    expect(result).toBe('skipped');
    expect(storage.has('key-2')).toBe(true);
  });

  it('deletes only a terminal owned orphan with no FileAsset/FileVersion', async () => {
    const storage = new InMemoryDriveArtifactStorage();
    await storage.putObject('key-3', new Uint8Array([1]), 'text/plain');
    const result = await deleteOwnedOrphanObject({
      db: {
        fileArtifactOperation: {
          findUnique: async () => ({
            id: 'op-3',
            status: 'EXPIRED',
            storageKey: 'key-3',
          }),
        },
        fileAsset: { findFirst: async () => null },
        fileVersion: { findFirst: async () => null },
      } as never,
      storage,
      operationId: 'op-3',
    });
    expect(result).toBe('deleted');
    expect(storage.has('key-3')).toBe(false);
  });
});
