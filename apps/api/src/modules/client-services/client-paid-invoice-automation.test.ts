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
      amount: new Decimal('10'),
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

  it('creates expense and task for paid purchase without credential', async () => {
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice());
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService());
    prisma.expense.findMany.mockResolvedValue([]);
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
        sourceInvoiceId: 'inv-1',
        amount: 12,
      }),
    );
    expect(flows.createTask).toHaveBeenCalled();
  });

  it('reuses the expense linked by sourceInvoiceId and skips a second task', async () => {
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice());
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService());
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'exp-existing',
        sourceInvoiceId: 'inv-1',
        dueDate: new Date(),
        status: 'DUE_NOW',
        notes: null,
      },
    ]);
    prisma.task.findFirst.mockResolvedValue({ id: 'task-existing' });

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1', actorEmployeeId: 'emp-1' },
    );

    expect(result).toEqual({ taskId: null, expenseId: 'exp-existing' });
    expect(flows.createExpense).not.toHaveBeenCalled();
    expect(flows.createTask).not.toHaveBeenCalled();
  });

  it('skips domain prep task when the registrar credential already exists', async () => {
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice());
    prisma.clientServiceRecord.findUnique.mockResolvedValue(
      buildService({ providerAccountId: 'cred-1', connectionMode: 'PURCHASE' }),
    );
    prisma.expense.findMany.mockResolvedValue([]);

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1', actorEmployeeId: 'emp-1' },
    );

    expect(result.expenseId).toBe('exp-new');
    expect(flows.createTask).not.toHaveBeenCalled();
  });

  it('creates expense but skips task without actor', async () => {
    prisma.invoice.findUnique.mockResolvedValue(paidInvoice());
    prisma.clientServiceRecord.findUnique.mockResolvedValue(buildService());
    prisma.expense.findMany.mockResolvedValue([]);

    const result = await runClientPaidInvoicePaidAutomation(
      prisma as never,
      flows as never as ClientServiceFlowsService,
      { invoiceId: 'inv-1' },
    );

    expect(result).toEqual({ taskId: null, expenseId: 'exp-new' });
    expect(flows.createTask).not.toHaveBeenCalled();
  });
});

function paidInvoice() {
  return {
    id: 'inv-1',
    amount: new Decimal('40'),
    moneyStatus: 'PAID',
    clientServiceRecordId: 'svc-1',
    paidDate: new Date('2026-05-01'),
  };
}

function buildService(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'svc-1',
    projectId: 'project-1',
    type: 'DOMAIN',
    name: 'example.com',
    provider: 'Namecheap',
    billingModel: 'WE_PAY',
    ourCost: new Decimal('12'),
    renewalDate: new Date('2026-06-01'),
    connectionMode: 'PURCHASE',
    providerAccountId: null,
    ...overrides,
  };
}
