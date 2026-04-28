import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensePlansService } from './expense-plans.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('ExpensePlansService', () => {
  let service: ExpensePlansService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ExpensePlansService(prisma as never);
  });

  it('findAll returns paginated meta', async () => {
    const result = await service.findAll({});
    expect(result.meta.page).toBe(1);
    expect(prisma.expensePlan.findMany).toHaveBeenCalled();
  });

  it('create rejects non-positive amount', async () => {
    await expect(
      service.create({
        name: 'Rent',
        category: 'HOSTING',
        amount: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create rejects unknown project', async () => {
    prisma.project.findUnique = vi.fn().mockResolvedValue(null);
    await expect(
      service.create({
        name: 'Rent',
        category: 'HOSTING',
        amount: 100,
        projectId: 'missing',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findById throws when missing', async () => {
    prisma.expensePlan.findUnique = vi.fn().mockResolvedValue(null);
    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create persists plan when project valid', async () => {
    prisma.project.findUnique = vi.fn().mockResolvedValue({ id: 'p1' });
    prisma.expensePlan.create = vi.fn().mockResolvedValue({
      id: 'plan-1',
      name: 'Hosting',
      category: 'HOSTING',
      amount: new Decimal('99.00'),
      frequency: 'MONTHLY',
      nextDueDate: null,
      provider: null,
      projectId: 'p1',
      autoGenerate: false,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { id: 'p1', code: 'P1', name: 'P' },
      _count: { expenses: 0 },
    });

    const row = await service.create({
      name: 'Hosting',
      category: 'HOSTING',
      amount: 99,
      projectId: 'p1',
    });

    expect(row.amount).toBe('99');
    expect(prisma.expensePlan.create).toHaveBeenCalled();
  });
});
