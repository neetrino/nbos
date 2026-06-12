import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { permanentlyDeleteProfileATrashedEntity } from './profile-a-permanent-delete.ops';
import type { AuditService } from '../../modules/audit/audit.service';

describe('permanentlyDeleteProfileATrashedEntity', () => {
  let prisma: MockPrisma;
  let auditService: Pick<AuditService, 'log'>;

  beforeEach(() => {
    prisma = createMockPrisma();
    auditService = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
  });

  it('hard-deletes purgeable trashed contact and writes audit', async () => {
    prisma.contact.findFirst.mockResolvedValue({ id: 'c-1' });

    await permanentlyDeleteProfileATrashedEntity(prisma as never, auditService as never, {
      key: 'contact',
      id: 'c-1',
      userId: 'u-1',
    });

    expect(prisma.contact.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'contact',
        entityId: 'c-1',
        action: 'contact.permanently_deleted',
        userId: 'u-1',
        changes: { manual: true },
      }),
    );
  });

  it('throws NotFound when entity is missing', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(
      permanentlyDeleteProfileATrashedEntity(prisma as never, auditService as never, {
        key: 'lead',
        id: 'missing',
        userId: 'u-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequest when entity is not in Trash', async () => {
    prisma.deal.findFirst.mockResolvedValue(null);
    prisma.deal.findUnique.mockResolvedValue({ trashedAt: null });

    await expect(
      permanentlyDeleteProfileATrashedEntity(prisma as never, auditService as never, {
        key: 'deal',
        id: 'd-1',
        userId: 'u-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws Conflict when trashed but relation guards block purge', async () => {
    prisma.partner.findFirst.mockResolvedValue(null);
    prisma.partner.findUnique.mockResolvedValue({ trashedAt: new Date('2026-06-01') });

    await expect(
      permanentlyDeleteProfileATrashedEntity(prisma as never, auditService as never, {
        key: 'partner',
        id: 'p-1',
        userId: 'u-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
