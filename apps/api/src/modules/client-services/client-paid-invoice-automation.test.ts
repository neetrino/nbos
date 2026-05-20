import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { runClientPaidInvoicePaidAutomation } from './client-paid-invoice-automation';
import type { ClientServiceFlowsService } from './client-service-flows.service';

describe('runClientPaidInvoicePaidAutomation', () => {
  let prisma: MockPrisma;
  let flows: {
    createExpense: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    flows = {
      createExpense: vi.fn().mockResolvedValue({ id: 'exp-new' }),
      createTask: vi.fn().mockResolvedValue({ id: 'task-new' }),
    };
  });

  it('skips when invoice is not linked to a client service', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      moneyStatus: 'PAID',
      clientServiceRecordId: null,
      paidDate: new Date(),
    });

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1', actorEmployeeId: 'emp-1' },
    );

    expect(result).toEqual({ taskId: null, expenseId: null });
    expect(flows.createExpense).not.toHaveBeenCalled();
  });

  it('creates expense and task for paid client-paid invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      moneyStatus: 'PAID',
      clientServiceRecordId: 'svc-1',
      paidDate: new Date('2026-05-01'),
    });
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService());
    prisma.expense.findFirst.mockResolvedValue(null);
    prisma.task.findFirst.mockResolvedValue(null);

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1', actorEmployeeId: 'emp-1' },
    );

    expect(result).toEqual({ taskId: 'task-new', expenseId: 'exp-new' });
    expect(flows.createExpense).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({
        status: 'DUE_NOW',
        notes: expect.stringContaining('NBOS invoiceId=inv-1'),
      }),
    );
    expect(flows.createTask).toHaveBeenCalledWith(
      'svc-1',
      expect.objectContaining({ creatorId: 'emp-1', priority: 'HIGH' }),
    );
  });

  it('is idempotent for expense and open task', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      moneyStatus: 'PAID',
      clientServiceRecordId: 'svc-1',
      paidDate: new Date(),
    });
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService());
    prisma.expense.findFirst.mockResolvedValue({ id: 'exp-existing' });
    prisma.task.findFirst.mockResolvedValue({ id: 'task-existing' });

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1', actorEmployeeId: 'emp-1' },
    );

    expect(result).toEqual({ taskId: null, expenseId: null });
    expect(flows.createExpense).not.toHaveBeenCalled();
    expect(flows.createTask).not.toHaveBeenCalled();
  });

  it('creates expense but skips task without actor', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      moneyStatus: 'PAID',
      clientServiceRecordId: 'svc-1',
      paidDate: new Date(),
    });
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService());
    prisma.expense.findFirst.mockResolvedValue(null);
    prisma.task.findFirst.mockResolvedValue(null);

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1' },
    );

    expect(result).toEqual({ taskId: null, expenseId: 'exp-new' });
    expect(flows.createTask).not.toHaveBeenCalled();
  });
});

function buildService() {
  return {
    id: 'svc-1',
    projectId: 'project-1',
    type: 'DOMAIN',
    name: 'example.com',
    provider: 'Namecheap',
    billingModel: 'CLIENT_PAID',
    ourCost: new Decimal('12'),
    renewalDate: new Date('2026-06-01'),
  };
}
