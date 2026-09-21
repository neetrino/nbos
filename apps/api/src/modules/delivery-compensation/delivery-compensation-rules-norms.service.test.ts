import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  CatalogContentValidationError,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseBaseProfileWriteBody,
  parseFunctionPriceWriteBody,
} from '@nbos/shared';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';

const FUNCTION_ID = '11111111-2222-3333-4444-555555555555';
const OTHER_ID = '66666666-7777-8888-9999-aaaaaaaaaaaa';

function vector(units: string | null = '10') {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    unitKind: 'REQUIRED',
    units,
  }));
}

function persistedRoleUnits(units: string | null) {
  return DELIVERY_COMPENSATION_ROLE_KEYS.map((roleKey) => ({
    roleKey,
    unitKind: 'REQUIRED',
    units,
  }));
}

describe('createFunctionPriceDraft', () => {
  it('creates version 1 as DRAFT and keeps null units null', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'price-1',
      functionId: FUNCTION_ID,
      version: 1,
      status: 'DRAFT',
      roleUnits: persistedRoleUnits(null),
    });
    const service = new DeliveryCompensationRulesService({
      deliveryFunction: { findUnique: vi.fn().mockResolvedValue({ id: FUNCTION_ID }) },
      deliveryFunctionPriceVersion: { findFirst: vi.fn().mockResolvedValue(null), create },
    } as never);

    const dto = await service.createFunctionPriceDraft(
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: vector(null),
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 1, status: 'DRAFT' }),
      }),
    );
    expect(dto.status).toBe('DRAFT');
    expect(dto.roleUnits.every((row) => row.units === null)).toBe(true);
  });

  it('increments the version above the latest one', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'price-4',
      functionId: FUNCTION_ID,
      version: 4,
      status: 'DRAFT',
      roleUnits: persistedRoleUnits('10'),
    });
    const service = new DeliveryCompensationRulesService({
      deliveryFunction: { findUnique: vi.fn().mockResolvedValue({ id: FUNCTION_ID }) },
      deliveryFunctionPriceVersion: {
        findFirst: vi.fn().mockResolvedValue({ version: 3 }),
        create,
      },
    } as never);

    await service.createFunctionPriceDraft(
      parseFunctionPriceWriteBody({
        functionId: FUNCTION_ID,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        roleUnits: vector(),
      }),
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 4 }) }),
    );
  });

  it('refuses an unknown function', async () => {
    const create = vi.fn();
    const service = new DeliveryCompensationRulesService({
      deliveryFunction: { findUnique: vi.fn().mockResolvedValue(null) },
      deliveryFunctionPriceVersion: { findFirst: vi.fn(), create },
    } as never);

    await expect(
      service.createFunctionPriceDraft(
        parseFunctionPriceWriteBody({
          functionId: FUNCTION_ID,
          effectiveFrom: '2026-10-01T00:00:00.000Z',
          roleUnits: vector(),
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('createBaseProfileDraft', () => {
  const body = {
    profileKey: 'ecommerce-classic',
    entityKind: 'PRODUCT',
    productType: 'ECOMMERCE',
    productCategory: 'CODE',
    configSize: 'CLASSIC',
    implementationBase: 'FROM_SCRATCH',
    designMode: 'FULL_DESIGN',
    effectiveFrom: '2026-10-01T00:00:00.000Z',
    roleUnits: vector('100'),
  };

  it('persists the profile with its included functions', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'profile-1',
      profileKey: 'ecommerce-classic',
      version: 1,
      status: 'DRAFT',
      roleUnits: persistedRoleUnits('100'),
      includedFunctions: [{ functionId: FUNCTION_ID }, { functionId: OTHER_ID }],
    });
    const service = new DeliveryCompensationRulesService({
      deliveryFunction: { count: vi.fn().mockResolvedValue(2) },
      deliveryBaseProfileVersion: { findFirst: vi.fn().mockResolvedValue(null), create },
    } as never);

    const dto = await service.createBaseProfileDraft(
      parseBaseProfileWriteBody({ ...body, includedFunctionIds: [FUNCTION_ID, OTHER_ID] }),
    );

    expect(dto.includedFunctionIds).toEqual([FUNCTION_ID, OTHER_ID]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', productType: 'ECOMMERCE' }),
      }),
    );
  });

  it('refuses unknown included functions', async () => {
    const create = vi.fn();
    const service = new DeliveryCompensationRulesService({
      deliveryFunction: { count: vi.fn().mockResolvedValue(1) },
      deliveryBaseProfileVersion: { findFirst: vi.fn(), create },
    } as never);

    await expect(
      service.createBaseProfileDraft(
        parseBaseProfileWriteBody({ ...body, includedFunctionIds: [FUNCTION_ID, OTHER_ID] }),
      ),
    ).rejects.toBeInstanceOf(CatalogContentValidationError);
    expect(create).not.toHaveBeenCalled();
  });
});
