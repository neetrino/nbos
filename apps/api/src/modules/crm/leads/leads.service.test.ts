import { describe, it, expect, beforeEach } from 'vitest';
import { LeadsService } from './leads.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new LeadsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns empty list with meta', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    });

    it('applies pagination', async () => {
      await service.findAll({ page: 2, pageSize: 10 });
      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('applies status filter', async () => {
      await service.findAll({ status: 'NEW' });
      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'NEW' }),
        }),
      );
    });

    it('applies search filter', async () => {
      await service.findAll({ search: 'John' });
      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns lead when found', async () => {
      const lead = { id: '1', code: 'L-2026-0001', contactName: 'John' };
      prisma.lead.findUnique.mockResolvedValue(lead);
      const result = await service.findById('1');
      expect(result).toEqual(lead);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('generates code and creates lead', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue({
        id: '1',
        code: 'L-2026-0001',
        contactName: 'John',
        source: 'WEBSITE',
      });

      const result = await service.create({
        contactName: 'John',
        source: 'WEBSITE',
      });

      expect(prisma.lead.create).toHaveBeenCalled();
      expect(result.code).toBe('L-2026-0001');
    });

    it('increments code number', async () => {
      prisma.lead.findFirst.mockResolvedValue({ code: 'L-2026-0005' });
      prisma.lead.create.mockImplementation(({ data }) => Promise.resolve({ id: '2', ...data }));

      await service.create({ contactName: 'Jane', source: 'MARKETING' });

      const createCall = prisma.lead.create.mock.calls[0][0];
      expect(createCall.data.code).toBe('L-2026-0006');
    });
  });

  describe('update', () => {
    it('updates lead when found', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: '1' });
      prisma.lead.update.mockResolvedValue({ id: '1', contactName: 'Updated' });

      const result = await service.update('1', { contactName: 'Updated' });
      expect(result.contactName).toBe('Updated');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes lead when found', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: '1' });
      await service.delete('1');
      expect(prisma.lead.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when not found', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        source: 'SALES',
        sourceDetail: 'COLD_CALL',
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });
      prisma.lead.update.mockResolvedValue({ id: '1', status: 'MQL' });

      const result = await service.updateStatus('1', 'MQL');
      expect(result.status).toBe('MQL');
    });

    it('blocks meaningful movement without attribution', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        source: 'MARKETING',
        sourceDetail: null,
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });

      await expect(service.updateStatus('1', 'MQL')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('returns stats structure', async () => {
      prisma.lead.count.mockResolvedValue(5);
      prisma.lead.groupBy.mockResolvedValue([{ status: 'NEW', _count: 3 }]);

      const stats = await service.getStats();
      expect(stats.total).toBe(5);
      expect(stats.byStatus).toHaveLength(1);
    });
  });
});
