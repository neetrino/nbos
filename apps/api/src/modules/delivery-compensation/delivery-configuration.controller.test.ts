import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DELIVERY_CONFIGURATION_PERMISSION_MODULE } from '@nbos/shared';
import { PERMISSION_KEY } from '../../common/decorators/require-permission.decorator';
import { DeliveryConfigurationController } from './delivery-configuration.controller';

describe('DeliveryConfigurationController route guards', () => {
  it('uses PROJECTS, not RULES or FINANCE_BONUSES', () => {
    expect(
      Reflect.getMetadata(PERMISSION_KEY, DeliveryConfigurationController.prototype.getByProduct),
    ).toEqual({
      module: DELIVERY_CONFIGURATION_PERMISSION_MODULE,
      action: 'VIEW',
    });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, DeliveryConfigurationController.prototype.enrollProduct),
    ).toEqual({
      module: DELIVERY_CONFIGURATION_PERMISSION_MODULE,
      action: 'EDIT',
    });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, DeliveryConfigurationController.prototype.addFeature),
    ).toEqual({
      module: DELIVERY_CONFIGURATION_PERMISSION_MODULE,
      action: 'EDIT',
    });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, DeliveryConfigurationController.prototype.removeFeature),
    ).toEqual({
      module: DELIVERY_CONFIGURATION_PERMISSION_MODULE,
      action: 'EDIT',
    });
    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        DeliveryConfigurationController.prototype.replaceEmployee,
      ),
    ).toEqual({
      module: DELIVERY_CONFIGURATION_PERMISSION_MODULE,
      action: 'EDIT',
    });
  });
});
