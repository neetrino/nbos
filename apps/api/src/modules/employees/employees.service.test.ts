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

  describe('findByClerkUserId', () => {
    it('returns employee by clerk id', async () => {
      prisma.employee.findUnique.mockResolvedValue({ id: '1', clerkUserId: 'clerk_1' });
      const result = await service.findByClerkUserId('clerk_1');
      expect(result?.clerkUserId).toBe('clerk_1');
    });

    it('returns null when not found', async () => {
      const result = await service.findByClerkUserId('missing');
      expect(result).toBeNull();
    });
  });

  describe('upsertFromClerk', () => {
    it('creates or updates employee', async () => {
      prisma.employee.upsert.mockResolvedValue({
        id: '1',
        clerkUserId: 'clerk_1',
        email: 'john@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role-observer',
      });

      const result = await service.upsertFromClerk({
        clerkUserId: 'clerk_1',
        email: 'john@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role-observer',
      });

      expect(result.roleId).toBe('role-observer');
      expect(prisma.employee.upsert).toHaveBeenCalled();
    });
  });
});
