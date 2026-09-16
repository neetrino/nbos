import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FINANCE_CLIENT_SERVICES_MODULE, FINANCE_EXPENSE_PLANS_MODULE } from '@nbos/shared';
import { financePermissionUser } from '../finance/finance-permission-test-support';
import { ClientServicesController } from './client-services.controller';

const CS_EDIT = { [`${FINANCE_CLIENT_SERVICES_MODULE}_EDIT`]: 'ALL' };

type FlowFns = {
  createInvoice: ReturnType<typeof vi.fn>;
  createExpense: ReturnType<typeof vi.fn>;
  createExpensePlan: ReturnType<typeof vi.fn>;
  createTask: ReturnType<typeof vi.fn>;
};

describe('client-service cross-entity conjunctions', () => {
  let flows: FlowFns;
  let controller: ClientServicesController;

  beforeEach(() => {
    flows = {
      createInvoice: vi.fn().mockResolvedValue({ id: 'inv-1' }),
      createExpense: vi.fn().mockResolvedValue({ id: 'exp-1' }),
      createExpensePlan: vi.fn().mockResolvedValue({ id: 'plan-1' }),
      createTask: vi.fn().mockResolvedValue({ id: 'task-1' }),
    };
    controller = new ClientServicesController(
      {} as never,
      flows as never,
      {} as never,
      {} as never,
    );
  });

  it('blocks create-invoice without FINANCE_INVOICES ADD', async () => {
    await expect(
      controller.createInvoice(financePermissionUser(CS_EDIT), 'svc-1', {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flows.createInvoice).not.toHaveBeenCalled();
  });

  it('creates an invoice when both rights are present', async () => {
    const user = financePermissionUser({ ...CS_EDIT, FINANCE_INVOICES_ADD: 'ALL' });
    await expect(controller.createInvoice(user, 'svc-1', {})).resolves.toEqual({ id: 'inv-1' });
    expect(flows.createInvoice).toHaveBeenCalledOnce();
  });

  it('blocks create-expense without FINANCE_EXPENSES EDIT', async () => {
    await expect(
      controller.createExpense(
        financePermissionUser({ ...CS_EDIT, FINANCE_EXPENSES_VIEW: 'ALL' }),
        'svc-1',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flows.createExpense).not.toHaveBeenCalled();
  });

  it('creates an expense when both rights are present', async () => {
    const user = financePermissionUser({ ...CS_EDIT, FINANCE_EXPENSES_EDIT: 'OWN' });
    await expect(controller.createExpense(user, 'svc-1', {})).resolves.toEqual({ id: 'exp-1' });
    expect(flows.createExpense).toHaveBeenCalledOnce();
  });

  it('blocks create-expense-plan without FINANCE_EXPENSE_PLANS ADD', async () => {
    await expect(
      controller.createExpensePlan(
        financePermissionUser({
          ...CS_EDIT,
          [`${FINANCE_EXPENSE_PLANS_MODULE}_VIEW`]: 'ALL',
        }),
        'svc-1',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flows.createExpensePlan).not.toHaveBeenCalled();
  });

  it('creates an expense plan when both rights are present', async () => {
    const user = financePermissionUser({
      ...CS_EDIT,
      [`${FINANCE_EXPENSE_PLANS_MODULE}_ADD`]: 'ALL',
    });
    await expect(controller.createExpensePlan(user, 'svc-1', {})).resolves.toEqual({
      id: 'plan-1',
    });
    expect(flows.createExpensePlan).toHaveBeenCalledOnce();
  });

  it('blocks create-task without TASKS ADD', async () => {
    await expect(
      controller.createTask(financePermissionUser({ ...CS_EDIT, TASKS_VIEW: 'ALL' }), 'svc-1', {
        creatorId: 'emp-1',
        title: 'Renew',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flows.createTask).not.toHaveBeenCalled();
  });

  it('creates a task when both rights are present', async () => {
    const user = financePermissionUser({ ...CS_EDIT, TASKS_ADD: 'ALL' });
    await expect(
      controller.createTask(user, 'svc-1', { creatorId: 'emp-1', title: 'Renew' }),
    ).resolves.toEqual({ id: 'task-1' });
    expect(flows.createTask).toHaveBeenCalledOnce();
  });

  it('treats a NONE target grant as missing', async () => {
    await expect(
      controller.createInvoice(
        financePermissionUser({ ...CS_EDIT, FINANCE_INVOICES_ADD: 'NONE' }),
        'svc-1',
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(flows.createInvoice).not.toHaveBeenCalled();
  });
});
