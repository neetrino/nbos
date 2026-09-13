import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { CRM_DEALS_MODULE, CRM_LEADS_MODULE } from '@nbos/shared';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../../common/decorators/require-permission.decorator';
import { LeadsController } from './leads/leads.controller';
import { DealsController } from './deals/deals.controller';

/**
 * Both controllers shipped without permission decorators, which the global `PermissionGuard`
 * treats as open: any authenticated employee could read, edit and permanently delete leads and
 * deals. This test pins the closed surface and, just as importantly, the handlers still left open
 * on purpose — so the remaining debt cannot grow silently.
 *
 * Canon: docs/NBOS/04-Roles-and-Access/02-Access-Matrix.md.
 */
function permissionOf(handler: unknown): RequiredPermission | undefined {
  return Reflect.getMetadata(PERMISSION_KEY, handler as object) as RequiredPermission | undefined;
}

function handlerNames(controller: { prototype: object }): string[] {
  return Object.getOwnPropertyNames(controller.prototype).filter((name) => name !== 'constructor');
}

const LEAD_EXPECTATIONS: Record<string, RequiredPermission> = {
  findAll: { module: CRM_LEADS_MODULE, action: 'VIEW' },
  findDuplicates: { module: CRM_LEADS_MODULE, action: 'VIEW' },
  findOne: { module: CRM_LEADS_MODULE, action: 'VIEW' },
  create: { module: CRM_LEADS_MODULE, action: 'ADD' },
  update: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  updateStatus: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  merge: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  pourIntoContact: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  createContact: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  attachContact: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  restore: { module: CRM_LEADS_MODULE, action: 'EDIT' },
  remove: { module: CRM_LEADS_MODULE, action: 'DELETE' },
  permanentRemove: { module: CRM_LEADS_MODULE, action: 'DELETE' },
  // Converting produces a deal, so the deal module decides.
  convertToDeal: { module: CRM_DEALS_MODULE, action: 'ADD' },
};

const DEAL_EXPECTATIONS: Record<string, RequiredPermission> = {
  findAll: { module: CRM_DEALS_MODULE, action: 'VIEW' },
  create: { module: CRM_DEALS_MODULE, action: 'ADD' },
  update: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  updateStatus: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  patchPartnerReferralTerms: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  startEarlyDelivery: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  createExceptionOrder: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  listWhatsAppAvailableGroups: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  ensureWhatsAppGroup: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  bindWhatsAppGroup: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  restore: { module: CRM_DEALS_MODULE, action: 'EDIT' },
  remove: { module: CRM_DEALS_MODULE, action: 'DELETE' },
  permanentRemove: { module: CRM_DEALS_MODULE, action: 'DELETE' },
  // The Finance Director creates the deposit order without any CRM permission.
  createDepositOrder: { module: 'FINANCE_INVOICES', action: 'ADD' },
};

/** Handlers still reachable without a CRM permission, each for a documented consumer. */
const KNOWN_OPEN_LEAD_HANDLERS = ['getStats'] as const;
const KNOWN_OPEN_DEAL_HANDLERS = ['getStats', 'findOne', 'getWhatsAppGroup'] as const;

describe('CRM lead permission wiring', () => {
  it.each(Object.entries(LEAD_EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (LeadsController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves only the documented handlers open', () => {
    const open = handlerNames(LeadsController).filter(
      (name) => !permissionOf((LeadsController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([...KNOWN_OPEN_LEAD_HANDLERS]);
  });
});

describe('CRM deal permission wiring', () => {
  it.each(Object.entries(DEAL_EXPECTATIONS))('requires %s', (name, expected) => {
    const handler = (DealsController.prototype as Record<string, unknown>)[name];
    expect(handler, `missing handler ${name}`).toBeTypeOf('function');
    expect(permissionOf(handler)).toEqual(expected);
  });

  it('leaves only the documented handlers open', () => {
    const open = handlerNames(DealsController).filter(
      (name) => !permissionOf((DealsController.prototype as Record<string, unknown>)[name]),
    );
    expect(open).toEqual([...KNOWN_OPEN_DEAL_HANDLERS]);
  });
});
