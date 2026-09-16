import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import type { RequiredPermission } from '../../common/decorators/require-permission.decorator';
import { handlerNames, permissionOf } from '../finance/finance-permission-test-support';
import { ClientServicesController } from './client-services.controller';

/**
 * This controller shipped without permission decorators, which the global `PermissionGuard`
 * treats as open. The map pins the closed surface after the FINANCE_CLIENT_SERVICES split.
 */
const EXPECTATIONS: Record<string, RequiredPermission> = {
  findAll: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' },
  getBoard: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' },
  getStats: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' },
  findOne: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' },
  create: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'ADD' },
  update: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  cancel: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  checkRegistry: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  createInvoice: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  createExpense: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  createExpensePlan: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  createTask: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'EDIT' },
  remove: { module: FINANCE_CLIENT_SERVICES_MODULE, action: 'DELETE' },
};

const MUTATIONS = Object.entries(EXPECTATIONS)
  .filter(([, requirement]) => requirement.action !== 'VIEW')
  .map(([name]) => name);

describe('Client services permission wiring', () => {
  it.each(Object.entries(EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (ClientServicesController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves no handler open', () => {
    const open = handlerNames(ClientServicesController).filter(
      (name) =>
        !permissionOf((ClientServicesController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([]);
  });

  it('does not treat VIEW as sufficient for any mutation', () => {
    for (const name of MUTATIONS) {
      expect(
        permissionOf((ClientServicesController.prototype as Record<string, unknown>)[name]),
      ).not.toEqual({ module: FINANCE_CLIENT_SERVICES_MODULE, action: 'VIEW' });
    }
  });
});
