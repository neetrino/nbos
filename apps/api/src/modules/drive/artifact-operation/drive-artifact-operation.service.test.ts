import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { DriveArtifactOperationService } from './drive-artifact-operation.service';
import { allowArtifactAuth } from './drive-artifact-auth.ports';
import { InMemoryDriveArtifactStorage } from './in-memory-drive-artifact-storage';
import type { ArtifactOperationRow } from './drive-artifact-operation.row';

interface FakeRow extends ArtifactOperationRow {
  [key: string]: unknown;
}

function createFakePrisma() {
  const operations = new Map<string, FakeRow>();
  const assets = new Map<string, { id: string; storageKey: string; deletedAt: Date | null }>();
  const versions: Array<{ id: string; fileAssetId: string; storageKey: string }> = [];
  const links: Array<{ id: string; fileAssetId: string; entityId: string }> = [];

  const fileArtifactOperation = {
    findUnique: async ({ where }: { where: { id?: string; storageKey?: string } }) => {
      if (where.id) return operations.get(where.id) ?? null;
      if (where.storageKey) {
        return [...operations.values()].find((row) => row.storageKey === where.storageKey) ?? null;
      }
      return null;
    },
    findFirst: async ({
      where,
    }: {
      where: {
        source?: string;
        actorId?: string;
        idempotencyKey?: string;
        storageKey?: string;
        status?: { in: string[] };
      };
    }) => {
      return (
        [...operations.values()].find((row) => {
          if (where.idempotencyKey && row.idempotencyKey !== where.idempotencyKey) return false;
          if (where.actorId && row.actorId !== where.actorId) return false;
          if (where.source && row.source !== where.source) return false;
          if (where.storageKey && row.storageKey !== where.storageKey) return false;
          if (where.status?.in && !where.status.in.includes(row.status)) return false;
          return true;
        }) ?? null
      );
    },
    create: async ({ data }: { data: Partial<FakeRow> }) => {
      const row = {
        ...data,
        id: data.id ?? randomUUID(),
        recoveryAttemptCount: data.recoveryAttemptCount ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as FakeRow;
      operations.set(row.id, row);
      return row;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<FakeRow> }) => {
      const current = operations.get(where.id);
      if (!current) throw new Error('missing');
      const next = { ...current, ...data, updatedAt: new Date() };
      operations.set(where.id, next);
      return next;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: { id: string; status?: string };
      data: Partial<FakeRow>;
    }) => {
      const current = operations.get(where.id);
      if (!current) return { count: 0 };
      if (where.status && current.status !== where.status) return { count: 0 };
      operations.set(where.id, { ...current, ...data, updatedAt: new Date() });
      return { count: 1 };
    },
  };

  const prisma = {
    fileArtifactOperation,
    fileAsset: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = assets.get(where.id);
        if (!row) return null;
        return {
          ...row,
          versions: versions.filter((item) => item.fileAssetId === row.id),
          links: links.filter((item) => item.fileAssetId === row.id),
        };
      },
      findFirst: async ({ where }: { where: { storageKey: string; deletedAt: null } }) => {
        const row = [...assets.values()].find(
          (item) => item.storageKey === where.storageKey && item.deletedAt === null,
        );
        if (!row) return null;
        return {
          ...row,
          versions: versions.filter((item) => item.fileAssetId === row.id),
          links: links.filter((item) => item.fileAssetId === row.id),
        };
      },
      create: async ({ data }: { data: { id?: string; storageKey: string } }) => {
        const id = data.id ?? randomUUID();
        assets.set(id, { id, storageKey: data.storageKey, deletedAt: null });
        const versionId = randomUUID();
        const linkId = randomUUID();
        versions.push({ id: versionId, fileAssetId: id, storageKey: data.storageKey });
        links.push({ id: linkId, fileAssetId: id, entityId: 'task-1' });
        return { id, versions: [{ id: versionId }], links: [{ id: linkId }] };
      },
    },
    fileVersion: {
      findFirst: async () => null,
    },
    fileLink: { findFirst: async () => null },
    driveFolderItem: { create: async () => ({ id: 'place-1' }) },
    $queryRaw: async () => [{ id: 'locked' }],
    $transaction: (() => {
      let chain = Promise.resolve();
      return async (fn: (tx: typeof prisma) => Promise<unknown>) => {
        const run = chain.then(() => fn(prisma));
        chain = run.then(
          () => undefined,
          () => undefined,
        );
        return run;
      };
    })(),
  };

  return { prisma, operations, assets };
}

function prepareInput(overrides: Record<string, unknown> = {}) {
  return {
    source: 'EXTERNAL_AI' as const,
    ingress: 'MACHINE_PUT' as const,
    storageKey: `nbos/tenants/t/files/tasks/task-1/${randomUUID()}.md`,
    entityType: 'TASK',
    entityId: 'task-1',
    displayName: 'notes.md',
    mimeType: 'text/markdown',
    actorType: 'EXTERNAL_AI',
    actorId: 'agent-1',
    agentId: 'agent-1',
    idempotencyKey: 'op-1',
    payloadFingerprint: 'fp',
    expectedSizeBytes: 4,
    ...overrides,
  };
}

describe('DriveArtifactOperationService crash matrix', () => {
  let service: DriveArtifactOperationService;
  let storage: InMemoryDriveArtifactStorage;
  let fake: ReturnType<typeof createFakePrisma>;

  beforeEach(() => {
    fake = createFakePrisma();
    storage = new InMemoryDriveArtifactStorage();
    service = new DriveArtifactOperationService(
      fake.prisma as never,
      {
        putObject: storage.putObject.bind(storage),
        headObject: storage.headObject.bind(storage),
        deleteObject: storage.deleteObject.bind(storage),
      } as never,
    );
  });

  it('persists identity before upload and recovers a crash before PutObject', async () => {
    const operation = await service.prepare(prepareInput());
    expect(operation.status).toBe('PREPARED');
    expect(storage.size()).toBe(0);
    const retried = await service.prepare(prepareInput({ storageKey: operation.storageKey }));
    expect(retried.id).toBe(operation.id);
    const result = await service.executeMachineUpload(
      operation.id,
      new Uint8Array([1, 2, 3, 4]),
      allowArtifactAuth(),
      storage,
    );
    expect(result.fileAssetId).toBeTruthy();
    expect(storage.size()).toBe(1);
  });

  it('resumes after object upload before DB finalization without a second object', async () => {
    const operation = await service.prepare(prepareInput());
    await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');
    const recovered = await service.recover(operation.id, allowArtifactAuth(), storage);
    expect('fileAssetId' in recovered).toBe(true);
    expect(storage.size()).toBe(1);
    const again = await service.executeMachineUpload(
      operation.id,
      new Uint8Array([1, 2, 3, 4]),
      allowArtifactAuth(),
      storage,
    );
    expect(again.fileAssetId).toBe((recovered as { fileAssetId: string }).fileAssetId);
    expect(storage.size()).toBe(1);
    expect(fake.assets.size).toBe(1);
  });

  it('completes from an existing FileAsset when the operation row crashed first', async () => {
    const operation = await service.prepare(prepareInput());
    await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');
    fake.assets.set('file-pre', {
      id: 'file-pre',
      storageKey: operation.storageKey,
      deletedAt: null,
    });
    const recovered = await service.recover(operation.id, allowArtifactAuth(), storage);
    expect(recovered).toMatchObject({ fileAssetId: 'file-pre' });
    expect(fake.operations.get(operation.id)?.status).toBe('COMPLETED');
  });

  it('rejects a changed payload on the same operation key', async () => {
    await service.prepare(prepareInput({ payloadFingerprint: 'aaa' }));
    await expect(
      service.prepare(prepareInput({ payloadFingerprint: 'bbb', storageKey: 'other-key' })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects cross-task target substitution on the same key', async () => {
    await service.prepare(prepareInput());
    await expect(
      service.prepare(prepareInput({ entityId: 'task-other', storageKey: 'other-key' })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects cross-task substitution when only the storage key matches', async () => {
    const operation = await service.prepare(prepareInput({ idempotencyKey: undefined }));
    await expect(
      service.prepare(
        prepareInput({
          entityId: 'task-other',
          storageKey: operation.storageKey,
          idempotencyKey: undefined,
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('fails closed on a missing object at finalize', async () => {
    const operation = await service.prepare(prepareInput());
    await expect(
      service.finalizeAfterObjectPresent(operation.id, {}, allowArtifactAuth(), storage),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces size mismatch against HeadObject', async () => {
    const operation = await service.prepare(prepareInput({ expectedSizeBytes: 99 }));
    await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');
    await expect(
      service.finalizeAfterObjectPresent(operation.id, {}, allowArtifactAuth(), storage),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('still finalizes after TTL if the object is already uploaded', async () => {
    const operation = await service.prepare(
      prepareInput({ expiresAt: new Date(Date.now() - 1_000) }),
    );
    await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');
    const result = await service.finalizeAfterObjectPresent(
      operation.id,
      {},
      allowArtifactAuth(),
      storage,
    );
    expect(result.fileAssetId).toBeTruthy();
  });

  it('concurrent finalize does not create a second FileAsset', async () => {
    const operation = await service.prepare(prepareInput());
    await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');
    const [a, b] = await Promise.all([
      service.finalizeAfterObjectPresent(operation.id, {}, allowArtifactAuth(), storage),
      service.finalizeAfterObjectPresent(operation.id, {}, allowArtifactAuth(), storage),
    ]);
    expect(a.fileAssetId).toBe(b.fileAssetId);
    expect(fake.assets.size).toBe(1);
  });

  it('duplicate finalize is idempotent', async () => {
    const operation = await service.prepare(prepareInput());
    const first = await service.executeMachineUpload(
      operation.id,
      new Uint8Array([1, 2, 3, 4]),
      allowArtifactAuth(),
      storage,
    );
    const second = await service.executeMachineUpload(
      operation.id,
      new Uint8Array([1, 2, 3, 4]),
      allowArtifactAuth(),
      storage,
    );
    expect(second).toEqual(first);
    expect(fake.assets.size).toBe(1);
  });
});
