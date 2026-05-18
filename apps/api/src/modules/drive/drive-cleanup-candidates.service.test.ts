import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveCleanupCandidatesService } from './drive-cleanup-candidates.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('DriveCleanupCandidatesService', () => {
  let prisma: MockPrisma;
  let service: DriveCleanupCandidatesService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.fileAsset.findMany.mockResolvedValue([]);
    prisma.fileAsset.count.mockResolvedValue(0);
    prisma.fileUploadSession.findMany.mockResolvedValue([]);
    prisma.fileUploadSession.count.mockResolvedValue(0);
    prisma.fileAsset.groupBy.mockResolvedValue([]);
    prisma.fileLink.findMany.mockResolvedValue([]);
    prisma.fileLink.count.mockResolvedValue(0);
    service = new DriveCleanupCandidatesService(prisma as never);
  });

  it('returns all cleanup candidate categories', async () => {
    const result = await service.listCandidates();
    expect(result.categories).toHaveLength(7);
    expect(result.categories.map((category) => category.kind)).toEqual([
      'orphan_files',
      'failed_upload_sessions',
      'expired_pending_upload_sessions',
      'duplicate_checksum',
      'temporary_exports',
      'soft_deleted_retention',
      'old_task_attachments',
    ]);
  });
});
