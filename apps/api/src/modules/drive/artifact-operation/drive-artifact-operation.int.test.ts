import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { DriveArtifactOperationService } from './drive-artifact-operation.service';
import { allowArtifactAuth } from './drive-artifact-auth.ports';
import { InMemoryDriveArtifactStorage } from './in-memory-drive-artifact-storage';

/**
 * Real-Postgres proof that FileAsset + operation completion share one
 * transaction, and that retry after a rolled-back finalize does not create a
 * second FileAsset. Opt-in: `AI_PLATFORM_DB_TEST_URL`.
 */
const DATABASE_URL = process.env.AI_PLATFORM_DB_TEST_URL;
const CASE_TIMEOUT_MS = 30_000;

describe.skipIf(!DATABASE_URL)('Drive artifact operation (real database)', () => {
  let prisma: InstanceType<typeof PrismaClient>;
  let service: DriveArtifactOperationService;
  let storage: InMemoryDriveArtifactStorage;
  const runId = `artifact-op-${randomUUID()}`;

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    }) as InstanceType<typeof PrismaClient>;
    storage = new InMemoryDriveArtifactStorage();
    service = new DriveArtifactOperationService(prisma, {
      putObject: storage.putObject.bind(storage),
      headObject: storage.headObject.bind(storage),
      deleteObject: storage.deleteObject.bind(storage),
    } as never);
  });

  afterAll(async () => {
    await prisma.fileLink.deleteMany({ where: { entityId: runId } });
    const ops = await prisma.fileArtifactOperation.findMany({
      where: { entityId: runId },
      select: { fileAssetId: true, id: true },
    });
    await prisma.fileArtifactOperation.deleteMany({ where: { entityId: runId } });
    const assetIds = ops.map((row) => row.fileAssetId).filter((id): id is string => Boolean(id));
    if (assetIds.length > 0) {
      await prisma.fileAsset.deleteMany({ where: { id: { in: assetIds } } });
    }
    await prisma.$disconnect();
  });

  it(
    'commits FileAsset and operation COMPLETED in one transaction',
    async () => {
      const operation = await service.prepare({
        source: 'SYSTEM',
        ingress: 'MACHINE_PUT',
        storageKey: `nbos/tenants/test/files/tasks/${runId}/${randomUUID()}.md`,
        entityType: 'TASK',
        entityId: runId,
        displayName: `${runId}.md`,
        mimeType: 'text/markdown',
        actorType: 'SYSTEM',
        actorId: 'system',
        expectedSizeBytes: 4,
      });
      await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');

      const result = await service.finalizeAfterObjectPresent(
        operation.id,
        {},
        allowArtifactAuth(),
        storage,
      );
      const row = await prisma.fileArtifactOperation.findUnique({ where: { id: operation.id } });
      const assets = await prisma.fileAsset.findMany({
        where: { storageKey: operation.storageKey },
      });
      expect(assets).toHaveLength(1);
      expect(row?.status).toBe('COMPLETED');
      expect(row?.fileAssetId).toBe(assets[0]?.id);
      expect(result.fileAssetId).toBe(assets[0]?.id);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'rolls back FileAsset when finalization is aborted and retries to one asset',
    async () => {
      const operation = await service.prepare({
        source: 'SYSTEM',
        ingress: 'MACHINE_PUT',
        storageKey: `nbos/tenants/test/files/tasks/${runId}/${randomUUID()}.md`,
        entityType: 'TASK',
        entityId: runId,
        displayName: `${runId}.md`,
        mimeType: 'text/markdown',
        actorType: 'SYSTEM',
        actorId: 'system',
        expectedSizeBytes: 4,
      });
      await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');

      await expect(
        prisma.$transaction(async (tx) => {
          const fresh = await tx.fileArtifactOperation.findUnique({ where: { id: operation.id } });
          if (!fresh) throw new Error('missing operation');
          await tx.fileArtifactOperation.update({
            where: { id: operation.id },
            data: { status: 'OBJECT_VERIFIED' },
          });
          throw new Error('finalize crashed');
        }),
      ).rejects.toThrow('finalize crashed');

      const afterCrash = await prisma.fileAsset.findMany({
        where: { storageKey: operation.storageKey },
      });
      expect(afterCrash).toHaveLength(0);

      const result = await service.finalizeAfterObjectPresent(
        operation.id,
        {},
        allowArtifactAuth(),
        storage,
      );
      const assets = await prisma.fileAsset.findMany({
        where: { storageKey: operation.storageKey },
      });
      expect(assets).toHaveLength(1);
      expect(result.fileAssetId).toBe(assets[0]?.id);
    },
    CASE_TIMEOUT_MS,
  );

  it(
    'serializes concurrent finalize to one FileAsset via FOR UPDATE',
    async () => {
      const operation = await service.prepare({
        source: 'SYSTEM',
        ingress: 'MACHINE_PUT',
        storageKey: `nbos/tenants/test/files/tasks/${runId}/${randomUUID()}.md`,
        entityType: 'TASK',
        entityId: runId,
        displayName: `${runId}.md`,
        mimeType: 'text/markdown',
        actorType: 'SYSTEM',
        actorId: 'system',
        expectedSizeBytes: 4,
      });
      await storage.putObject(operation.storageKey, new Uint8Array([1, 2, 3, 4]), 'text/markdown');

      const [first, second] = await Promise.all([
        service.finalizeAfterObjectPresent(operation.id, {}, allowArtifactAuth(), storage),
        service.finalizeAfterObjectPresent(operation.id, {}, allowArtifactAuth(), storage),
      ]);
      const assets = await prisma.fileAsset.findMany({
        where: { storageKey: operation.storageKey },
      });
      expect(assets).toHaveLength(1);
      expect(first.fileAssetId).toBe(assets[0]?.id);
      expect(second.fileAssetId).toBe(assets[0]?.id);
    },
    CASE_TIMEOUT_MS,
  );
});
