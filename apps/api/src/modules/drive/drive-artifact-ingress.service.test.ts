import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { DriveService } from './drive.service';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = mockSend;
    constructor() {}
  }
  return {
    S3Client: MockS3Client,
    ListObjectsV2Command: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

const TENANT_ID = '00000000-0000-4000-8000-000000000001';

function makeArtifactsMock() {
  return {
    prepare: vi.fn().mockResolvedValue({ id: 'op-1', storageKey: 'key-1', status: 'PREPARED' }),
    findByStorageKey: vi.fn().mockResolvedValue(null),
    executeMachineUpload: vi.fn().mockResolvedValue({
      fileAssetId: 'file-1',
      fileVersionId: 'ver-1',
      fileLinkId: 'link-1',
    }),
    finalizeAfterObjectPresent: vi.fn().mockResolvedValue({
      fileAssetId: 'file-1',
      fileVersionId: 'ver-2',
      fileLinkId: 'link-1',
    }),
    loadCompletedFile: vi.fn().mockResolvedValue({ id: 'file-1' }),
    fingerprintBytes: vi.fn().mockReturnValue('fp-body'),
  };
}

describe('DriveService artifact ingress', () => {
  let prisma: MockPrisma;
  let artifacts: ReturnType<typeof makeArtifactsMock>;
  let service: DriveService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    artifacts = makeArtifactsMock();
    service = new DriveService(
      prisma as never,
      {
        ensureS3: () => ({ send: mockSend }) as never,
        bucket: 'test-bucket',
        publicUrl: 'https://cdn.example.com',
      } as never,
      { create: vi.fn() } as never,
      { getSummary: vi.fn(), buildProjectLevelWhere: vi.fn().mockResolvedValue({}) } as never,
      {
        get: (key: string) => (key === 'NBOS_TENANT_ORGANIZATION_ID' ? TENANT_ID : undefined),
      } as never,
      artifacts as never,
    );
  });

  it('always prepares a generated asset with fingerprint and target', async () => {
    const body = Buffer.from('hello');
    await service.createGeneratedFileAsset({
      displayName: 'notes.md',
      storageKey: `nbos/tenants/${TENANT_ID}/files/tasks/task-1/notes.md`,
      content: body,
      mimeType: 'text/markdown',
      link: { entityType: 'TASK', entityId: 'task-1' },
    });

    expect(artifacts.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'SYSTEM',
        storageKey: `nbos/tenants/${TENANT_ID}/files/tasks/task-1/notes.md`,
        entityType: 'TASK',
        entityId: 'task-1',
        checksum: 'fp-body',
        payloadFingerprint: 'fp-body',
      }),
    );
    expect(artifacts.findByStorageKey).not.toHaveBeenCalled();
    expect(artifacts.executeMachineUpload).toHaveBeenCalledWith('op-1', body, expect.anything());
    expect(artifacts.fingerprintBytes).toHaveBeenCalledWith(body);
  });

  it('rejects a generated asset when prepare conflicts on fingerprint or target', async () => {
    artifacts.prepare.mockRejectedValue(
      new ConflictException('Artifact operation key was reused with a different payload.'),
    );
    await expect(
      service.createGeneratedFileAsset({
        displayName: 'notes.md',
        storageKey: `nbos/tenants/${TENANT_ID}/files/tasks/task-1/notes.md`,
        content: 'changed',
        mimeType: 'text/markdown',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(artifacts.executeMachineUpload).not.toHaveBeenCalled();
  });

  it('completes a version through the durable operation, not the legacy path', async () => {
    const storageKey = `nbos/tenants/${TENANT_ID}/_staging/versions/f1/up-1/v2.pdf`;
    prisma.fileAsset.findFirst.mockResolvedValue({
      id: 'f1',
      ownerId: 'emp-1',
      createdById: 'emp-1',
      deletedAt: null,
      status: 'ACTIVE',
      storageProvider: 'R2',
      links: [],
      versions: [],
    });
    artifacts.findByStorageKey.mockResolvedValue({
      id: 'op-v1',
      entityId: 'f1',
      targetFileAssetId: 'f1',
      storageKey,
    });

    const result = await service.completeFileVersion('f1', 'emp-1', {
      storageKey,
      sizeBytes: 12,
    });

    expect(result).toEqual({ id: 'file-1' });
    expect(artifacts.finalizeAfterObjectPresent).toHaveBeenCalledWith(
      'op-v1',
      expect.objectContaining({ sizeBytes: 12 }),
      expect.anything(),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
