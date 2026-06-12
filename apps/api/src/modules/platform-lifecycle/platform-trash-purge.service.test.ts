import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { PlatformTrashPurgeService } from './platform-trash-purge.service';

describe('PlatformTrashPurgeService', () => {
  let prisma: MockPrisma;
  const auditService = { log: vi.fn() };
  const driveR2 = {} as never;

  beforeEach(() => {
    prisma = createMockPrisma();
    auditService.log.mockReset();
    prisma.credential.findMany.mockResolvedValue([]);
    prisma.fileAsset.findMany.mockResolvedValue([]);
    prisma.emailThread.findMany.mockResolvedValue([]);
  });

  it('writes platform audit when purge completes', async () => {
    const service = new PlatformTrashPurgeService(prisma as never, auditService as never, driveR2);
    const result = await service.runRetentionPurge(new Date('2026-06-12T03:30:00.000Z'));

    expect(result.totalPurged).toBe(0);
    expect(result.profileA).toHaveLength(6);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'platform.trash_retention_purge_run' }),
    );
  });
});
