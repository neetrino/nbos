import { describe, it, expect, beforeEach } from 'vitest';
import { EmployeesService } from './employees.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new EmployeesService(prisma as never);
  });

  describe('findAll', () => {
    it('returns all employees', async () => {
      prisma.employee.findMany.mockResolvedValue([{ id: '1', firstName: 'John' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('returns employee when found', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: '1', firstName: 'John' });
      const result = await service.findById('1');
      expect(result.firstName).toBe('John');
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('returns employee by email', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: '1', email: 'john@test.com' });
      const result = await service.findByEmail('john@test.com');
      expect(result?.email).toBe('john@test.com');
    });

    it('returns null when not found', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('missing@test.com');
      expect(result).toBeNull();
    });
  });
});
