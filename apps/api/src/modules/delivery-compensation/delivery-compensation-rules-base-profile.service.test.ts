import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  CatalogContentValidationError,
  DELIVERY_COMPENSATION_ROLE_KEYS,
  parseBaseProfileWriteBody,
} from '@nbos/shared';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';

function rulesClient(partial: Record<string, unknown>) {
  const prisma = { ...partial };
  return {
    ...prisma,
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
  };
}

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

describe('createBaseProfileDraft', () => {
  const body = {
    productType: 'ECOMMERCE',
    implementationBase: 'FROM_SCRATCH',
    designMode: 'FULL_DESIGN',
    effectiveFrom: '2026-10-01T00:00:00.000Z',
    roleUnits: vector('100'),
  };

  it('creates version 1 on the kind key and ignores a client profile key', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'profile-1',
      profileKey: 'ecommerce',
      productType: 'ECOMMERCE',
      version: 1,
      status: 'DRAFT',
      roleUnits: persistedRoleUnits('100'),
      includedFunctions: [{ functionId: FUNCTION_ID }, { functionId: OTHER_ID }],
    });
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryFunction: { count: vi.fn().mockResolvedValue(2) },
        deliveryBaseProfileVersion: {
          findMany: vi.fn().mockResolvedValue([]),
          create,
          update: vi.fn(),
        },
      }) as never,
    );

    const dto = await service.createBaseProfileDraft(
      parseBaseProfileWriteBody({
        ...body,
        profileKey: 'second-core',
        includedFunctionIds: [FUNCTION_ID, OTHER_ID],
      }),
    );

    expect(dto.includedFunctionIds).toEqual([FUNCTION_ID, OTHER_ID]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DRAFT',
          productType: 'ECOMMERCE',
          profileKey: 'ecommerce',
          version: 1,
        }),
      }),
    );
  });

  it('updates the open draft of the same kind instead of creating a second key', async () => {
    const create = vi.fn();
    const update = vi.fn().mockResolvedValue({
      id: 'profile-draft',
      profileKey: 'shop',
      productType: 'ECOMMERCE',
      version: 2,
      status: 'DRAFT',
      roleUnits: persistedRoleUnits('100'),
      includedFunctions: [],
    });
    const deleteMany = vi.fn();
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryFunction: { count: vi.fn().mockResolvedValue(0) },
        deliveryBaseProfileVersion: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'profile-draft',
              profileKey: 'shop',
              productType: 'ECOMMERCE',
              productCategory: null,
              version: 2,
              status: 'DRAFT',
            },
          ]),
          create,
          update,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        deliveryBaseProfileRoleUnit: { deleteMany },
        deliveryBaseIncludedFunction: { deleteMany },
      }) as never,
    );

    await service.createBaseProfileDraft(parseBaseProfileWriteBody(body));

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
    expect(deleteMany).toHaveBeenCalled();
  });

  it('refuses unknown included functions', async () => {
    const create = vi.fn();
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryFunction: { count: vi.fn().mockResolvedValue(1) },
        deliveryBaseProfileVersion: {
          findMany: vi.fn().mockResolvedValue([]),
          create,
          update: vi.fn(),
        },
      }) as never,
    );

    await expect(
      service.createBaseProfileDraft(
        parseBaseProfileWriteBody({ ...body, includedFunctionIds: [FUNCTION_ID, OTHER_ID] }),
      ),
    ).rejects.toBeInstanceOf(CatalogContentValidationError);
    expect(create).not.toHaveBeenCalled();
  });

  it('opens the next version on the key already used for that kind', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'profile-5',
      profileKey: 'shop',
      productType: 'ECOMMERCE',
      version: 5,
      status: 'DRAFT',
      roleUnits: persistedRoleUnits('100'),
      includedFunctions: [],
    });
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryFunction: { count: vi.fn().mockResolvedValue(0) },
        deliveryBaseProfileVersion: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'profile-published',
              profileKey: 'shop',
              productType: 'ECOMMERCE',
              productCategory: 'CODE',
              version: 4,
              status: 'PUBLISHED',
            },
          ]),
          create,
        },
        deliveryBaseProfileCoreItem: { findMany: vi.fn().mockResolvedValue([]) },
      }) as never,
    );

    await service.createBaseProfileDraft(parseBaseProfileWriteBody(body));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileKey: 'shop', version: 5, status: 'DRAFT' }),
      }),
    );
  });

  it('does not rewrite a core that left draft before the save', async () => {
    const deleteMany = vi.fn();
    const update = vi.fn();
    const service = new DeliveryCompensationRulesService(
      rulesClient({
        deliveryFunction: { count: vi.fn().mockResolvedValue(0) },
        deliveryBaseProfileVersion: {
          findUnique: vi.fn().mockResolvedValue({ id: 'profile-draft', status: 'DRAFT' }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          update,
        },
        deliveryBaseProfileRoleUnit: { deleteMany },
        deliveryBaseIncludedFunction: { deleteMany },
      }) as never,
    );

    await expect(
      service.updateBaseProfileDraft('profile-draft', {
        roleUnits: vector('100'),
        includedFunctionIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(deleteMany).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
