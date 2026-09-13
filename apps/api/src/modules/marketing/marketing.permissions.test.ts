import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { MARKETING_MODULE } from '@nbos/shared';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../../common/decorators/require-permission.decorator';
import { MarketingController } from './marketing.controller';

/**
 * This controller shipped without any permission decorator, which the global
 * `PermissionGuard` treats as open. The class-level requirement is the floor, so this test
 * fails whenever a new handler is added that would silently reopen it.
 *
 * Canon: docs/NBOS/02-Modules/18-Marketing/00-Marketing-Overview.md.
 */
function permissionOf(target: unknown): RequiredPermission | undefined {
  return Reflect.getMetadata(PERMISSION_KEY, target as object) as RequiredPermission | undefined;
}

/** Handler names that intentionally do not use the MARKETING module. */
const CRM_FORM_DICTIONARY_READS = ['getCrmWhereOptions', 'getAttributionOptions'] as const;

const EXPECTED_WRITE_ACTIONS: Record<string, 'EDIT' | 'ADD'> = {
  updateCrmWhereOption: 'EDIT',
  createAccount: 'ADD',
  updateAccount: 'EDIT',
  createActivity: 'ADD',
  updateActivity: 'EDIT',
  launchActivity: 'EDIT',
};

describe('Marketing permission wiring', () => {
  it('requires MARKETING VIEW as the controller floor', () => {
    expect(permissionOf(MarketingController)).toEqual({
      module: MARKETING_MODULE,
      action: 'VIEW',
    });
  });

  it('keeps the CRM form dictionaries readable with CRM_LEADS VIEW', () => {
    for (const name of CRM_FORM_DICTIONARY_READS) {
      expect(permissionOf(MarketingController.prototype[name])).toEqual({
        module: 'CRM_LEADS',
        action: 'VIEW',
      });
    }
  });

  it('requires an explicit write permission for every mutation', () => {
    for (const [name, action] of Object.entries(EXPECTED_WRITE_ACTIONS)) {
      const handler = (MarketingController.prototype as Record<string, unknown>)[name];
      expect(handler, `missing handler ${name}`).toBeTypeOf('function');
      expect(permissionOf(handler)).toEqual({ module: MARKETING_MODULE, action });
    }
  });

  it('never leaves a handler on the permissionless default', () => {
    const handlers = Object.getOwnPropertyNames(MarketingController.prototype).filter(
      (name) => name !== 'constructor',
    );

    for (const name of handlers) {
      const handler = (MarketingController.prototype as Record<string, unknown>)[name];
      const own = permissionOf(handler);
      const isWrite = name in EXPECTED_WRITE_ACTIONS;
      const isDictionaryRead = (CRM_FORM_DICTIONARY_READS as readonly string[]).includes(name);

      if (isWrite || isDictionaryRead) {
        expect(own, `${name} must declare its own permission`).toBeDefined();
        continue;
      }

      // Reads inherit the class floor; an override would have to be deliberate.
      expect(own ?? { module: MARKETING_MODULE, action: 'VIEW' }).toEqual({
        module: MARKETING_MODULE,
        action: 'VIEW',
      });
    }
  });
});
