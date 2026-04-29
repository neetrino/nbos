import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = mockSend;
    constructor() {}
  }
  return {
    S3Client: MockS3Client,
    HeadObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

import { DriveUploadSessionService } from './drive-upload-session.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

function makeR2Mock() {
  return {
    ensureS3: () => ({ send: mockSend }) as never,
    bucket: 'test-bucket',
    publicUrl: 'https://cdn.example.com',
  };
}

describe('DriveUploadSessionService', () => {
  let service: DriveUploadSessionService;
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    service = new DriveUploadSessionService(prisma as never, makeR2Mock() as never);
  });

  it('lists library using SUPPORT context mapping', async () => {
    await service.listDriveLibrary('SUPPORT', 'ticket-1');

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          links: { some: { entityType: 'SUPPORT_TICKET', entityId: 'ticket-1', unlinkedAt: null } },
        }),
      }),
    );
  });

  it('creates upload session with key under Drive/uploads/', async () => {
    prisma.fileUploadSession.create.mockResolvedValue({
      id: 'sess-1',
      storageKey: 'Drive/uploads/sess-1/doc.pdf',
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    const result = await service.createUploadSession(
      {
        fileName: 'doc.pdf',
        contentType: 'application/pdf',
        entityType: 'PROJECT',
        entityId: 'p1',
      },
      'user-1',
    );

    expect(result.uploadUrl).toBe('https://presigned-url.example.com');
    expect(result.storageKey).toMatch(/^Drive\/uploads\//);
    expect(prisma.fileUploadSession.create).toHaveBeenCalled();
  });

  it('completes upload session after HeadObject succeeds', async () => {
    const future = new Date(Date.now() + 3_600_000);
    const sessionRow = {
      id: 'sess-1',
      status: 'PENDING',
      storageKey: 'Drive/uploads/sess-1/doc.pdf',
      entityType: 'TASK',
      entityId: 't1',
      displayName: 'doc.pdf',
      originalName: 'doc.pdf',
      mimeType: 'application/pdf',
      purpose: null,
      sourceModule: null,
      visibility: 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
      linkType: 'TASK_ATTACHMENT',
      createdById: 'user-1',
      fileAssetId: null,
      expiresAt: future,
      failedReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.fileUploadSession.findUnique.mockResolvedValue(sessionRow);
    mockSend.mockResolvedValueOnce({ ContentLength: 12 });

    prisma.fileAsset.create.mockResolvedValueOnce({
      id: 'fa-1',
      displayName: 'doc.pdf',
      versions: [],
      links: [],
    });

    const out = await service.completeUploadSession('sess-1', 'user-1', { sizeBytes: 12 });

    expect(out.id).toBe('fa-1');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
