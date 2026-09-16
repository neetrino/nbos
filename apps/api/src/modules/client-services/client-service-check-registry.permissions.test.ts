import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import { financePermissionUser } from '../finance/finance-permission-test-support';
import { ClientServicesController } from './client-services.controller';
import type { DomainRegistryCheckOutcome } from './registry/domain-registry.types';

const CS_EDIT = { [`${FINANCE_CLIENT_SERVICES_MODULE}_EDIT`]: 'ALL' };

type AccessFns = {
  assertAccessible: ReturnType<typeof vi.fn>;
};

type RegistryFns = {
  checkService: ReturnType<typeof vi.fn>;
};

type RenewalFns = {
  runDueRenewalInvoices: ReturnType<typeof vi.fn>;
};

function checkResult(outcome: DomainRegistryCheckOutcome): { outcome: DomainRegistryCheckOutcome } {
  return { outcome };
}

describe('client-service check-registry invoice side effect', () => {
  let access: AccessFns;
  let registry: RegistryFns;
  let renewal: RenewalFns;
  let controller: ClientServicesController;

  beforeEach(() => {
    access = { assertAccessible: vi.fn().mockResolvedValue(undefined) };
    registry = { checkService: vi.fn().mockResolvedValue(checkResult('corrected')) };
    renewal = { runDueRenewalInvoices: vi.fn().mockResolvedValue({ created: [] }) };
    controller = new ClientServicesController(
      access as never,
      {} as never,
      registry as never,
      renewal as never,
    );
  });

  it('skips renewal invoices when FINANCE_INVOICES ADD is NONE', async () => {
    const user = financePermissionUser({ ...CS_EDIT, FINANCE_INVOICES_ADD: 'NONE' });
    await expect(controller.checkRegistry('svc-1', user)).resolves.toEqual(
      checkResult('corrected'),
    );
    expect(registry.checkService).toHaveBeenCalledOnce();
    expect(renewal.runDueRenewalInvoices).not.toHaveBeenCalled();
  });

  it('skips renewal invoices when FINANCE_INVOICES ADD is absent', async () => {
    const user = financePermissionUser(CS_EDIT);
    await expect(controller.checkRegistry('svc-1', user)).resolves.toEqual(
      checkResult('corrected'),
    );
    expect(registry.checkService).toHaveBeenCalledOnce();
    expect(renewal.runDueRenewalInvoices).not.toHaveBeenCalled();
  });

  it('runs renewal invoices when the caller holds FINANCE_INVOICES ADD', async () => {
    const user = financePermissionUser({ ...CS_EDIT, FINANCE_INVOICES_ADD: 'ALL' });
    await expect(controller.checkRegistry('svc-1', user)).resolves.toEqual(
      checkResult('corrected'),
    );
    expect(renewal.runDueRenewalInvoices).toHaveBeenCalledWith({ serviceId: 'svc-1' });
  });

  it('does not run renewal invoices unless the outcome is corrected', async () => {
    registry.checkService.mockResolvedValue(checkResult('unchanged'));
    const user = financePermissionUser({ ...CS_EDIT, FINANCE_INVOICES_ADD: 'ALL' });
    await expect(controller.checkRegistry('svc-1', user)).resolves.toEqual(
      checkResult('unchanged'),
    );
    expect(renewal.runDueRenewalInvoices).not.toHaveBeenCalled();
  });
});
