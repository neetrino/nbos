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
