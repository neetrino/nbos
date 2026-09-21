import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DELIVERY_COMPENSATION_RULES_MODULE } from '@nbos/shared';
import { PERMISSION_KEY } from '../../common/decorators/require-permission.decorator';
import { DeliveryCompensationRulesController } from './delivery-compensation-rules.controller';

const VIEW = { module: DELIVERY_COMPENSATION_RULES_MODULE, action: 'VIEW' };

describe('DeliveryCompensationRulesController route guards', () => {
  it('requires RULES VIEW on every financial read', () => {
    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        DeliveryCompensationRulesController.prototype.listFunctionPrices,
      ),
    ).toEqual(VIEW);
    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        DeliveryCompensationRulesController.prototype.listBaseProfiles,
      ),
    ).toEqual(VIEW);
    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        DeliveryCompensationRulesController.prototype.listRoleRates,
      ),
    ).toEqual(VIEW);
  });
});
