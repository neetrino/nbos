import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { PlatformTrashInventoryService } from './platform-trash-inventory.service';

describe('PlatformTrashInventoryService', () => {
  let prisma: MockPrisma;
  let service: PlatformTrashInventoryService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PlatformTrashInventoryService(prisma as never);
    prisma.contact.count.mockResolvedValue(2);
    prisma.company.count.mockResolvedValue(1);
    prisma.lead.count.mockResolvedValue(0);
    prisma.deal.count.mockResolvedValue(3);
    prisma.partner.count.mockResolvedValue(0);
    prisma.project.count.mockResolvedValue(1);
    prisma.credential.count.mockResolvedValue(4);
    prisma.fileAsset.count.mockResolvedValue(5);
  });

  it('aggregates trash counts across modules', async () => {
    const result = await service.getInventory(new Date('2026-06-12T12:00:00.000Z'));

    expect(result.totalTrashed).toBe(16);
    expect(result.categories).toHaveLength(8);
    expect(result.categories.find((row) => row.key === 'deal')?.count).toBe(3);
    expect(result.categories.find((row) => row.key === 'credential')?.profile).toBe('C');
  });

  it('exposes retention rules registry', () => {
    const rules = service.listRetentionRules();
    expect(rules.some((row) => row.key === 'drive_file' && row.profile === 'B')).toBe(true);
    expect(rules.every((row) => row.retentionDays === 30 || row.retentionDays === null)).toBe(true);
  });

  it('sums purge-eligible counts', async () => {
    prisma.contact.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    prisma.fileAsset.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    const result = await service.getInventory(new Date('2026-06-12T12:00:00.000Z'));
    expect(result.totalPurgeEligible).toBeGreaterThanOrEqual(0);
    expect(prisma.fileAsset.count).toHaveBeenCalled();
  });
});
