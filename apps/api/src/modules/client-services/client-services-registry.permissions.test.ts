import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import {
  expectHandlerAllowed,
  expectHandlerDenied,
  financePermissionUser,
  handlerNames,
  permissionOf,
} from '../finance/finance-permission-test-support';
import { ClientServicesRegistryController } from './client-services-registry.controller';

const CS_VIEW = { [`${FINANCE_CLIENT_SERVICES_MODULE}_VIEW`]: 'ALL' };
const CS_EDIT = { [`${FINANCE_CLIENT_SERVICES_MODULE}_EDIT`]: 'ALL' };

describe('Client services bulk registry check permissions', () => {
  it('requires FINANCE_CLIENT_SERVICES EDIT on every handler', () => {
    for (const name of handlerNames(ClientServicesRegistryController)) {
      const handler = (ClientServicesRegistryController.prototype as Record<string, unknown>)[name];
      expect(permissionOf(handler)).toEqual({
        module: FINANCE_CLIENT_SERVICES_MODULE,
        action: 'EDIT',
      });
    }
  });

  it('rejects VIEW-only callers and allows EDIT', () => {
    expectHandlerDenied(ClientServicesRegistryController, 'checkRegistryAll', CS_VIEW);
    expectHandlerAllowed(ClientServicesRegistryController, 'checkRegistryAll', CS_EDIT);
  });

  it('passes the caller scope and identity to the bulk service', async () => {
    const bulk = { checkPage: vi.fn().mockResolvedValue({ done: true }) };
    const controller = new ClientServicesRegistryController(bulk as never);
    const user = financePermissionUser({
      ...CS_EDIT,
      [`${FINANCE_CLIENT_SERVICES_MODULE}_VIEW`]: 'OWN',
    });

    await controller.checkRegistryAll(user, { cursor: null });

    expect(bulk.checkPage).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: null,
        access: expect.objectContaining({ employeeId: user.id, viewScope: 'OWN' }),
      }),
    );
  });
});
