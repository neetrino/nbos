import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensePlansService } from './expense-plans.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('ExpensePlansService', () => {
  let service: ExpensePlansService;
  let prisma: MockPrisma;
  let expensesService: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    expensesService = { create: vi.fn().mockResolvedValue({ id: 'exp-1' }) };
    service = new ExpensePlansService(prisma as never, expensesService as never);
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

  it('create accepts WEEKLY frequency', async () => {
    prisma.expensePlan.create = vi.fn().mockResolvedValue({
      id: 'plan-weekly',
      name: 'Weekly SaaS',
      category: 'TOOLS',
      amount: new Decimal('25.00'),
      frequency: 'WEEKLY',
      nextDueDate: new Date('2026-08-20T00:00:00.000Z'),
      projectId: null,
      autoGenerate: false,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: null,
      _count: { expenses: 0 },
    });

    const row = await service.create({
      name: 'Weekly SaaS',
      category: 'TOOLS',
      amount: 25,
      frequency: 'WEEKLY',
      nextDueDate: '2026-08-20T00:00:00.000Z',
    });

    expect(row.frequency).toBe('WEEKLY');
    expect(prisma.expensePlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ frequency: 'WEEKLY' }),
      }),
    );
  });

  it('generateCard delegates to ExpensesService and updates plan next due', async () => {
    prisma.expensePlan.findUnique = vi.fn().mockResolvedValue({
      id: 'plan-1',
      name: 'Rent',
      category: 'HOSTING',
      amount: new Decimal('100'),
      frequency: 'MONTHLY',
      nextDueDate: new Date('2026-03-01T00:00:00.000Z'),
      projectId: null,
      autoGenerate: false,
      notes: null,
    });
    prisma.expensePlan.update = vi.fn().mockResolvedValue({});

    const result = await service.generateCard('plan-1', {});

    expect(expensesService.create).toHaveBeenCalledWith(
      expect.objectContaining({ expensePlanId: 'plan-1', type: 'PLANNED' }),
    );
    expect(prisma.expensePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { nextDueDate: new Date('2026-04-01T00:00:00.000Z') },
    });
    expect(result).toEqual({ id: 'exp-1' });
  });

  it('generateCard advances WEEKLY nextDueDate by seven days', async () => {
    prisma.expensePlan.findUnique = vi.fn().mockResolvedValue({
      id: 'plan-w',
      name: 'Weekly tool',
      category: 'TOOLS',
      amount: new Decimal('10'),
      frequency: 'WEEKLY',
      nextDueDate: new Date('2026-08-15T00:00:00.000Z'),
      projectId: null,
      autoGenerate: false,
      notes: null,
      clientServiceRecordId: null,
    });
    prisma.expensePlan.update = vi.fn().mockResolvedValue({});

    await service.generateCard('plan-w', {});

    expect(prisma.expensePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-w' },
      data: { nextDueDate: new Date('2026-08-22T00:00:00.000Z') },
    });
  });

  it('generateCard clears nextDueDate for ONE_TIME plans', async () => {
    prisma.expensePlan.findUnique = vi.fn().mockResolvedValue({
      id: 'plan-once',
      name: 'One-off',
      category: 'OTHER',
      amount: new Decimal('50'),
      frequency: 'ONE_TIME',
      nextDueDate: new Date('2026-08-15T00:00:00.000Z'),
      projectId: null,
      autoGenerate: false,
      notes: null,
      clientServiceRecordId: null,
    });
    prisma.expensePlan.update = vi.fn().mockResolvedValue({});

    await service.generateCard('plan-once', {});

    expect(prisma.expensePlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-once' },
      data: { nextDueDate: null },
    });
  });

  it('autoGenerateDuePlans rejects invalid asOf', async () => {
    await expect(service.autoGenerateDuePlans({ asOf: 'not-iso' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('autoGenerateDuePlans runs generateCard for each eligible plan', async () => {
    prisma.expensePlan.findMany = vi.fn().mockResolvedValue([{ id: 'plan-a' }, { id: 'plan-b' }]);
    const spy = vi.spyOn(service, 'generateCard').mockResolvedValue({ id: 'ex-1' } as never);

    const res = await service.autoGenerateDuePlans({});

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('plan-a', {});
    expect(spy).toHaveBeenCalledWith('plan-b', {});
    expect(res.eligibleCount).toBe(2);
    expect(res.created).toHaveLength(2);
    expect(res.failures).toHaveLength(0);
    spy.mockRestore();
  });

  it('autoGenerateDuePlans records failures when generateCard throws', async () => {
    prisma.expensePlan.findMany = vi.fn().mockResolvedValue([{ id: 'plan-x' }]);
    const spy = vi.spyOn(service, 'generateCard').mockRejectedValue(new Error('card failed'));

    const res = await service.autoGenerateDuePlans({});

    expect(res.created).toHaveLength(0);
    expect(res.failures).toEqual([{ planId: 'plan-x', message: 'card failed' }]);
    spy.mockRestore();
  });
});
