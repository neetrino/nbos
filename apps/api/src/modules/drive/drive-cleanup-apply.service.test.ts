import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveCleanupApplyService } from './drive-cleanup-apply.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

const mockR2Send = vi.fn();

function makeR2Mock() {
  return {
    bucket: 'test-bucket',
    ensureS3: () => ({ send: mockR2Send }),
  };
}

describe('DriveCleanupApplyService', () => {
  let prisma: MockPrisma;
  let audit: { log: ReturnType<typeof vi.fn> };
  let service: DriveCleanupApplyService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockR2Send.mockResolvedValue({});
    prisma = createMockPrisma();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    prisma.fileUploadSession.deleteMany.mockResolvedValue({ count: 1 });
    prisma.fileUploadSession.findMany.mockResolvedValue([{ id: 'session-1' }]);
    prisma.fileAsset.findMany.mockResolvedValue([]);
    prisma.fileAsset.updateMany.mockResolvedValue({ count: 0 });
    prisma.fileAsset.deleteMany.mockResolvedValue({ count: 0 });
    prisma.fileLink.updateMany.mockResolvedValue({ count: 0 });
    prisma.$transaction.mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.fileAuditEvent.createMany.mockResolvedValue({ count: 0 });
    service = new DriveCleanupApplyService(prisma as never, audit as never, makeR2Mock() as never);
  });

  it('rejects unknown cleanup kind', async () => {
    await expect(
      service.applyCleanup('user-1', 'unknown_kind', ['a'], false),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires ids when applyAll is false', async () => {
    await expect(
      service.applyCleanup('user-1', 'failed_upload_sessions', [], false),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('applies failed upload session cleanup and writes audit', async () => {
    const result = await service.applyCleanup(
      'user-1',
      'failed_upload_sessions',
      ['session-1'],
      false,
    );

    expect(result.applied).toBe(1);
    expect(prisma.fileUploadSession.deleteMany).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'drive_cleanup.applied',
        entityId: 'failed_upload_sessions',
      }),
    );
  });

  it('purges retention trash files from R2 and hard-deletes DB rows', async () => {
    prisma.fileAsset.findMany.mockResolvedValue([
      {
        id: 'file-1',
        storageProvider: 'R2',
        storageKey: 'nbos/tenant/file-1.pdf',
        versions: [{ storageKey: 'nbos/tenant/file-1-v2.pdf' }],
      },
    ]);
    prisma.fileAsset.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.applyCleanup(
      'user-1',
      'soft_deleted_retention',
      ['file-1'],
      false,
    );

    expect(result.applied).toBe(1);
    expect(mockR2Send).toHaveBeenCalledTimes(2);
    expect(prisma.fileAsset.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['file-1'] } },
    });
    expect(audit.log).toHaveBeenCalled();
  });

  it('supports applyAll for expired export artifacts', async () => {
    prisma.fileAsset.findMany.mockResolvedValue([{ id: 'file-1' }]);
    prisma.fileAsset.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.applyCleanup('user-1', 'temporary_exports', undefined, true);

    expect(result.kind).toBe('temporary_exports');
    expect(audit.log).toHaveBeenCalled();
  });
});
