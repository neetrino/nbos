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
        name: 'Website redesign',
        contactName: '',
        source: null,
      });

      const result = await service.create({
        name: 'Website redesign',
      });

      expect(prisma.lead.create).toHaveBeenCalled();
      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contactName: '',
            source: undefined,
          }),
        }),
      );
      expect(result.code).toBe('L-2026-0001');
    });

    it('increments code number', async () => {
      prisma.lead.findFirst.mockResolvedValue({ code: 'L-2026-0005' });
      prisma.lead.create.mockImplementation(({ data }) => Promise.resolve({ id: '2', ...data }));

      await service.create({ name: 'Jane lead' });

      const createCall = prisma.lead.create.mock.calls[0][0];
      expect(createCall.data.code).toBe('L-2026-0006');
    });

    it('defaults assignedTo to creator when actorId is provided', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockImplementation(({ data }) => Promise.resolve({ id: '1', ...data }));

      await service.create({ name: 'Quick lead' }, { actorId: 'emp-1' });

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assignedTo: 'emp-1' }),
        }),
      );
    });
  });

  describe('update', () => {
    it('updates lead when found', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'NEW',
        source: null,
        sourceDetail: null,
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });
      prisma.lead.update.mockResolvedValue({ id: '1', contactName: 'Updated' });

      const result = await service.update('1', { contactName: 'Updated' });
      expect(result.contactName).toBe('Updated');
    });

    it('rejects clearing attribution on a locked stage', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'MQL',
        source: 'SALES',
        sourceDetail: 'COLD_CALL',
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });

      await expect(service.update('1', { source: null, sourceDetail: null })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof BadRequestException &&
          (err.getResponse() as { code?: string }).code === 'ATTRIBUTION_IMMUTABLE',
      );
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('allows replacing attribution on a locked stage when still valid', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'MQL',
        source: 'SALES',
        sourceDetail: 'COLD_CALL',
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });
      prisma.lead.update.mockResolvedValue({
        id: '1',
        status: 'MQL',
        source: 'SALES',
        sourceDetail: 'COLD_EMAIL',
      });

      const result = await service.update('1', { sourceDetail: 'COLD_EMAIL' });
      expect(result.sourceDetail).toBe('COLD_EMAIL');
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
        status: 'CONTACT_ESTABLISHED',
        contactName: 'Jane Doe',
        phone: '+37400000000',
        email: null,
        assignedTo: 'emp-1',
        notes: 'Qualified',
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
        status: 'CONTACT_ESTABLISHED',
        contactName: 'Jane Doe',
        phone: '+37400000000',
        email: null,
        assignedTo: 'emp-1',
        notes: 'Reached out',
        source: 'MARKETING',
        sourceDetail: null,
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });

      await expect(service.updateStatus('1', 'MQL')).rejects.toThrow(BadRequestException);
    });

    it('allows restoring spam lead to an active stage without attribution when target is NEW', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'SPAM',
        contactName: 'Jane Doe',
        phone: '+37400000000',
        email: null,
        assignedTo: null,
        notes: 'Spam duplicate',
        source: 'PARTNER',
        sourceDetail: null,
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });
      prisma.lead.update.mockResolvedValue({ id: '1', status: 'NEW' });

      const result = await service.updateStatus('1', 'NEW');

      expect(result.status).toBe('NEW');
    });

    it('blocks moving a won lead back to an active stage', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'SQL',
        source: 'SALES',
        sourceDetail: 'COLD_CALL',
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });

      await expect(service.updateStatus('1', 'MQL')).rejects.toMatchObject({
        response: {
          code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        },
      });
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('blocks direct spam to won movement', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'SPAM',
        source: 'SALES',
        sourceDetail: 'COLD_CALL',
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });

      await expect(service.updateStatus('1', 'SQL')).rejects.toMatchObject({
        response: {
          code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        },
      });
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('allows NEW → ON_HOLD without marketing attribution', async () => {
      prisma.lead.findUnique.mockResolvedValue({
        id: '1',
        status: 'NEW',
        contactName: 'Jane Doe',
        phone: '+37400000000',
        email: null,
        assignedTo: null,
        notes: null,
        source: null,
        sourceDetail: null,
        sourcePartnerId: null,
        sourceContactId: null,
        marketingAccountId: null,
        marketingActivityId: null,
      });
      prisma.lead.update.mockResolvedValue({ id: '1', status: 'ON_HOLD' });

      const result = await service.updateStatus('1', 'ON_HOLD');

      expect(result.status).toBe('ON_HOLD');
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
