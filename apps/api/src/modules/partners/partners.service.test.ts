import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { PartnersService } from './partners.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

function mockPartnerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    name: 'P1',
    type: 'REGULAR',
    direction: 'INBOUND',
    defaultPercent: new Decimal('30.00'),
    status: 'ACTIVE',
    contactId: null,
    notes: null,
    startDate: null,
    agreementStatus: 'NO_AGREEMENT',
    agreementStartDate: null,
    agreementEndDate: null,
    agreementSpecialTerms: null,
    agreementFileAssetId: null,
    agreementOwnerId: null,
    agreementFileAsset: null,
    agreementOwner: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    contact: null,
    _count: { orders: 0, subscriptions: 0 },
    ...overrides,
  };
}

describe('PartnersService', () => {
  let service: PartnersService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PartnersService(prisma as never);
  });

  describe('findAll', () => {
    it('should list partners with pagination', async () => {
      prisma.partner.findMany.mockResolvedValue([mockPartnerRow({ id: '1', name: 'Partner A' })]);
      prisma.partner.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe('Partner A');
      expect(result.items[0].level).toBe('REGULAR');
      expect(result.items[0].defaultPercent).toBe('30.00');
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ search: 'acme' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'acme', mode: 'insensitive' } },
              { notes: { contains: 'acme', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ status: 'ACTIVE' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });

    it('should filter by level', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ level: 'PREMIUM' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'PREMIUM' }),
        }),
      );
    });

    it('should reject invalid level filter', async () => {
      await expect(service.findAll({ level: 'INBOUND' })).rejects.toThrow(BadRequestException);
    });

    it('should filter by direction', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({ direction: 'OUTBOUND' });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ direction: 'OUTBOUND' }),
        }),
      );
    });

    it('should include contact summary for list rows', async () => {
      prisma.partner.findMany.mockResolvedValue([]);
      prisma.partner.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            contact: { select: { id: true, firstName: true, lastName: true } },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return partner', async () => {
      prisma.partner.findUnique.mockResolvedValue(mockPartnerRow());

      const result = await service.findById('1');
      expect(result.name).toBe('P1');
      expect(result.level).toBe('REGULAR');
      expect(result.updatedAt).toBe('2026-01-02T00:00:00.000Z');
    });

    it('should throw NotFoundException', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create partner with defaults', async () => {
      prisma.partner.create.mockResolvedValue(mockPartnerRow({ name: 'New Partner' }));

      const result = await service.create({ name: 'New Partner' });

      expect(prisma.partner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Partner',
            type: 'REGULAR',
            direction: 'INBOUND',
            defaultPercent: 30,
            status: 'ACTIVE',
          }),
        }),
      );
      expect(result.level).toBe('REGULAR');
    });

    it('should reject defaultPercent out of range', async () => {
      await expect(service.create({ name: 'x', defaultPercent: 101 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create({ name: 'x', defaultPercent: Number.NaN })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update partner fields', async () => {
      prisma.partner.findUnique.mockResolvedValue(mockPartnerRow());
      prisma.partner.update.mockResolvedValue(
        mockPartnerRow({ name: 'Updated', defaultPercent: new Decimal('25.00') }),
      );

      const result = await service.update('1', { name: 'Updated', defaultPercent: 25 });

      expect(prisma.partner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Updated',
            defaultPercent: 25,
          }),
        }),
      );
      expect(result.name).toBe('Updated');
      expect(result.defaultPercent).toBe('25.00');
    });

    it('should throw NotFoundException for missing partner', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid defaultPercent on update', async () => {
      prisma.partner.findUnique.mockResolvedValue(mockPartnerRow());
      await expect(service.update('1', { defaultPercent: -1 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should delete partner', async () => {
      prisma.partner.findUnique.mockResolvedValue(mockPartnerRow());
      await service.delete('1');
      expect(prisma.partner.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('getCommissionPolicy', () => {
    it('returns four deal types with fallback from partner default', async () => {
      prisma.partner.findUnique.mockResolvedValue({
        id: 'p1',
        defaultPercent: new Decimal('25'),
      });
      prisma.partnerCommissionPolicyRow.findMany.mockResolvedValue([
        { dealType: 'PRODUCT', percent: new Decimal('30') },
      ]);

      const r = await service.getCommissionPolicy('p1');

      expect(r.fallbackPercent).toBe('25.00');
      expect(r.rows).toHaveLength(4);
      expect(r.rows.find((x) => x.dealType === 'PRODUCT')?.percent).toBe('30.00');
      expect(r.rows.find((x) => x.dealType === 'EXTENSION')?.percent).toBeNull();
    });
  });

  describe('getPartnerAccrualBalance', () => {
    it('throws when partner is missing', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);
      await expect(service.getPartnerAccrualBalance('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns roll-up from groupBy', async () => {
      prisma.partner.findUnique.mockResolvedValue(mockPartnerRow());
      prisma.partnerAccrual.groupBy.mockResolvedValue([
        { status: 'ELIGIBLE', _sum: { amount: new Decimal('10') } },
      ]);

      const r = await service.getPartnerAccrualBalance('1');

      expect(r.unpaidTotal).toBe('10.00');
      expect(r.byStatus.ELIGIBLE).toBe('10.00');
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats', async () => {
      prisma.partner.count.mockResolvedValue(10);
      prisma.subscription.count.mockResolvedValue(25);
      prisma.partner.aggregate.mockResolvedValue({
        _avg: { defaultPercent: new Decimal('28.5') },
      });

      const stats = await service.getStats();

      expect(stats.total).toBe(10);
      expect(stats.totalSubscriptions).toBe(25);
      expect(stats.avgPayoutPercent).toBe(28.5);
    });
  });
});
