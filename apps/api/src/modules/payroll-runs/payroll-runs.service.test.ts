import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PayrollRunsService } from './payroll-runs.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('PayrollRunsService', () => {
  let service: PayrollRunsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PayrollRunsService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated envelope', async () => {
      prisma.payrollRun.findMany.mockResolvedValue([
        { id: '1', payrollMonth: '2026-03', _count: { salaryLines: 0 } },
      ]);
      prisma.payrollRun.count.mockResolvedValue(1);
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns journal derived from durable timestamps', async () => {
      prisma.payrollRun.findUnique.mockResolvedValue({
        id: 'p1',
        payrollMonth: '2026-04',
        status: 'CLOSED',
        totalBaseSalary: 0,
        totalBonuses: 0,
        totalAdjustments: 0,
        totalDeductions: 0,
        totalPayable: 0,
        totalPaid: 0,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        updatedAt: new Date('2026-04-10T10:00:00.000Z'),
        approvedAt: new Date('2026-04-05T12:00:00.000Z'),
        closedAt: new Date('2026-04-06T08:00:00.000Z'),
        salaryLines: [],
        createdBy: { id: 'e1', firstName: 'A', lastName: 'B' },
        approvedBy: { id: 'e2', firstName: 'C', lastName: 'D' },
      });
      const result = await service.findById('p1');
      expect(result.journal).toHaveLength(3);
      expect(result.journal.map((j: { kind: string }) => j.kind)).toEqual([
        'CREATED',
        'APPROVED',
        'CLOSED',
      ]);
    });
  });

  describe('create', () => {
    it('rejects invalid month', async () => {
      await expect(service.create({ payrollMonth: '2026-13' }, 'emp-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate month', async () => {
      prisma.payrollRun.findUnique.mockResolvedValue({ id: 'existing', payrollMonth: '2026-03' });
      await expect(service.create({ payrollMonth: '2026-03' }, 'emp-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
