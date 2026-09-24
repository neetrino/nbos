import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DELIVERY_CONFIGURATION_PERMISSION_MODULE } from '@nbos/shared';
import { PERMISSION_KEY } from '../../common/decorators/require-permission.decorator';
import { DeliveryConfigurationController } from './delivery-configuration.controller';

/**
 * Every route, not a sample: a handler that silently loses its decorator would fall back to the
 * bare AuthGuard, and these are the commands that decide who gets paid.
 */
const ROUTES: Array<[keyof DeliveryConfigurationController, 'VIEW' | 'EDIT']> = [
  ['getByProduct', 'VIEW'],
  ['enrollProduct', 'EDIT'],
  ['getByExtension', 'VIEW'],
  ['enrollExtension', 'EDIT'],
  ['listExtensionRoleAssignments', 'VIEW'],
  ['setExtensionRoleAssignments', 'EDIT'],
  ['setParameters', 'EDIT'],
  ['setVolume', 'EDIT'],
  ['addFeature', 'EDIT'],
  ['removeFeature', 'EDIT'],
  ['getReplacementPlan', 'EDIT'],
  ['replaceEmployee', 'EDIT'],
];

describe('DeliveryConfigurationController route guards', () => {
  it('gates on DELIVERY_CONFIGURATION, not on PROJECTS, RULES or FINANCE_BONUSES', () => {
    expect(DELIVERY_CONFIGURATION_PERMISSION_MODULE).toBe('DELIVERY_CONFIGURATION');
  });

  it.each(ROUTES)('requires %s on %s', (handler, action) => {
    expect(
      Reflect.getMetadata(PERMISSION_KEY, DeliveryConfigurationController.prototype[handler]),
    ).toEqual({ module: DELIVERY_CONFIGURATION_PERMISSION_MODULE, action });
  });

  it('covers every handler the controller exposes', () => {
    const handlers = Object.getOwnPropertyNames(DeliveryConfigurationController.prototype).filter(
      (name) =>
        name !== 'constructor' &&
        Reflect.getMetadata(
          PERMISSION_KEY,
          DeliveryConfigurationController.prototype[name as keyof DeliveryConfigurationController],
        ) !== undefined,
    );
    expect(handlers.sort()).toEqual(ROUTES.map(([name]) => name).sort());
  });
});
