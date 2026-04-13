import { describe, it, expect, beforeEach } from 'vitest';
import { CompaniesService } from './companies.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CompaniesService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'Neetrino' });
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
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
    it('creates company with defaults', async () => {
      await service.create({ name: 'Test Co', contactId: 'c1' });
      expect(prisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Co',
            type: 'LEGAL',
            taxStatus: 'TAX',
          }),
        }),
      );
    });

    it('creates company with custom type and bankDetails', async () => {
      await service.create({
        name: 'Custom Co',
        contactId: 'c1',
        type: 'INDIVIDUAL',
        taxStatus: 'NO_TAX',
        bankDetails: { bank: 'ACBA', account: '123' },
      });
      expect(prisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'INDIVIDUAL',
            taxStatus: 'NO_TAX',
          }),
        }),
      );
    });
  });

  describe('findAll (branch coverage)', () => {
    it('applies type filter', async () => {
      await service.findAll({ type: 'LEGAL' });
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'LEGAL' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates company fields', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: '1' });
      prisma.company.update.mockResolvedValue({ id: '1', name: 'Updated' });
      const result = await service.update('1', {
        name: 'Updated',
        contactId: 'c2',
        type: 'INDIVIDUAL',
        taxId: '123',
        legalAddress: 'Address',
        taxStatus: 'NO_TAX',
        notes: 'note',
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('delete', () => {
    it('deletes when found', async () => {
      prisma.company.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.company.delete).toHaveBeenCalled();
    });
  });
});
