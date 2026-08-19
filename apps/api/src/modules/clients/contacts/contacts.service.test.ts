import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactsService } from './contacts.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuditService } from '../../audit/audit.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: MockPrisma;
  let auditService: Pick<AuditService, 'log'>;

  beforeEach(() => {
    prisma = createMockPrisma();
    auditService = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
    service = new ContactsService(prisma as never, auditService as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('defaults to active scope', async () => {
      await service.findAll({});
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ trashedAt: null }),
        }),
      );
    });

    it('applies trash scope', async () => {
      await service.findAll({ scope: 'trash' });
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ trashedAt: { not: null } }),
        }),
      );
    });

    it('applies contact type filter', async () => {
      await service.findAll({ contactType: 'CLIENT' });
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'CLIENT' }),
        }),
      );
    });

    it('keeps role filter as a compatibility alias', async () => {
      await service.findAll({ role: 'PARTNER' });
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'PARTNER' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates contact with default role', async () => {
      await service.create({ firstName: 'John', lastName: 'Doe' });
      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'CLIENT' }),
        }),
      );
    });
  });

  describe('findAll (branch coverage)', () => {
    it('applies search filter', async () => {
      await service.findAll({ search: 'John' });
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('applies custom sort', async () => {
      await service.findAll({ sortBy: 'firstName', sortOrder: 'asc' });
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { firstName: 'asc' },
        }),
      );
    });
  });

  describe('create (branch coverage)', () => {
    it('creates contact with custom role', async () => {
      await service.create({ firstName: 'Jane', lastName: 'Doe', role: 'PARTNER' });
      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'PARTNER' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates contact fields', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: null });
      prisma.contact.update.mockResolvedValue({ id: '1', firstName: 'Updated' });
      const result = await service.update('1', {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+37499999',
        email: 'new@test.com',
        role: 'PARTNER',
        notes: 'note',
      });
      expect(result.firstName).toBe('Updated');
    });

    it('blocks update when contact is in Trash', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: new Date() });
      await expect(service.update('1', { firstName: 'Updated' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('drops an extra phone that matches the new primary', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: null });
      prisma.contact.update.mockResolvedValue({ id: '1', phone: '+37499123456' });
      await service.update('1', { phone: '+37499123456' });
      expect(prisma.contactPhone.deleteMany).toHaveBeenCalledWith({
        where: { contactId: '1', e164: { in: expect.arrayContaining(['+37499123456']) } },
      });
    });
  });

  describe('addExtraPhone', () => {
    it('stores a normalized extra when primary is different', async () => {
      prisma.contact.findUnique
        .mockResolvedValueOnce({
          id: '1',
          phone: '+37499000000',
          trashedAt: null,
          extraPhones: [],
        })
        .mockResolvedValueOnce({
          id: '1',
          phone: '+37499000000',
          extraPhones: [{ id: 'p-1', e164: '+37499111111' }],
        });
      const result = await service.addExtraPhone('1', '+374 99 111111');
      expect(prisma.contactPhone.create).toHaveBeenCalledWith({
        data: { contactId: '1', e164: '+37499111111' },
        select: { id: true, e164: true, createdAt: true },
      });
      expect(result.extraPhones).toEqual([{ id: 'p-1', e164: '+37499111111' }]);
    });

    it('rejects a duplicate of the primary', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: '1',
        phone: '+37499111111',
        trashedAt: null,
        extraPhones: [],
      });
      await expect(service.addExtraPhone('1', '+37499111111')).rejects.toMatchObject({
        response: { code: 'CONTACT_PHONE_DUPLICATE' },
      });
      expect(prisma.contactPhone.create).not.toHaveBeenCalled();
    });

    it('rejects empty junk', async () => {
      await expect(service.addExtraPhone('1', '   ')).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeExtraPhone', () => {
    it('deletes the extra row', async () => {
      prisma.contact.findUnique
        .mockResolvedValueOnce({ id: '1', trashedAt: null })
        .mockResolvedValueOnce({ id: '1', extraPhones: [] });
      prisma.contactPhone.findFirst.mockResolvedValue({ id: 'p-1' });
      await service.removeExtraPhone('1', 'p-1');
      expect(prisma.contactPhone.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });
  });

  describe('moveToTrash', () => {
    it('sets trashedAt when active', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: null });
      await service.moveToTrash('1');
      expect(prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ trashedAt: expect.any(Date) }),
        }),
      );
    });

    it('throws when already in Trash', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: new Date() });
      await expect(service.moveToTrash('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('restoreFromTrash', () => {
    it('clears trashedAt when in Trash', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: new Date() });
      await service.restoreFromTrash('1');
      expect(prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { trashedAt: null },
        }),
      );
    });

    it('throws when not in Trash', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1', trashedAt: null });
      await expect(service.restoreFromTrash('1')).rejects.toThrow(BadRequestException);
    });

    it('blocks restore when mergedIntoId is set', async () => {
      prisma.contact.findUnique.mockResolvedValue({
        id: '1',
        trashedAt: new Date(),
        mergedIntoId: 'surv-1',
      });
      await expect(service.restoreFromTrash('1')).rejects.toMatchObject({
        response: { code: 'CONTACT_RESTORE_BLOCKED_MERGED' },
      });
    });
  });
});
