import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { PERMISSION_KEY } from '../../common/decorators/require-permission.decorator';
import { FunctionCatalogController } from './function-catalog.controller';

describe('FunctionCatalogController route guards', () => {
  it('requires FUNCTION_CATALOG VIEW on list and get', () => {
    expect(Reflect.getMetadata(PERMISSION_KEY, FunctionCatalogController.prototype.list)).toEqual({
      module: FUNCTION_CATALOG_MODULE,
      action: 'VIEW',
    });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, FunctionCatalogController.prototype.getById),
    ).toEqual({
      module: FUNCTION_CATALOG_MODULE,
      action: 'VIEW',
    });
  });

  it('requires FUNCTION_CATALOG ADD on create, not RULES or COMPANY', () => {
    expect(Reflect.getMetadata(PERMISSION_KEY, FunctionCatalogController.prototype.create)).toEqual(
      {
        module: FUNCTION_CATALOG_MODULE,
        action: 'ADD',
      },
    );
  });

  it('keeps archive on DELETE and content writes off RULES', () => {
    expect(
      Reflect.getMetadata(PERMISSION_KEY, FunctionCatalogController.prototype.archive),
    ).toEqual({
      module: FUNCTION_CATALOG_MODULE,
      action: 'DELETE',
    });
    expect(
      Reflect.getMetadata(PERMISSION_KEY, FunctionCatalogController.prototype.replaceContent),
    ).toEqual({
      module: FUNCTION_CATALOG_MODULE,
      action: 'EDIT',
    });
  });
});
