import { describe, it, expect, beforeEach } from 'vitest';
import { ContactsService } from './contacts.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ContactsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies role filter', async () => {
      await service.findAll({ role: 'CLIENT' });
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'CLIENT' }),
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
      prisma.contact.findUnique.mockResolvedValue({ id: '1' });
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
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.contact.delete).toHaveBeenCalled();
    });
  });
});
