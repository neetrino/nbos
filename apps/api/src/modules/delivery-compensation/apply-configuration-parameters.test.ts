import { describe, expect, it, vi } from 'vitest';
import { applyConfigurationParameters } from './apply-configuration-parameters';

const PARAMETERS = {
  configSize: 'CLASSIC',
  implementationBase: 'FROM_SCRATCH',
  designMode: 'AI_DESIGN',
  aiDesignerReview: false,
} as const;

function buildDb(overrides: Record<string, unknown> = {}) {
  const update = vi.fn();
  const createMany = vi.fn();
  return {
    update,
    createMany,
    db: {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          scopeLockedAt: null,
          initialRevisionId: null,
          entityKind: 'PRODUCT',
          product: { status: 'DEVELOPMENT', productType: 'ECOMMERCE', productCategory: 'CODE' },
          extension: null,
        }),
        update,
      },
      deliveryBaseProfileVersion: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'profile-shop',
            productType: 'ECOMMERCE',
            productCategory: 'CODE',
            includedFunctions: [{ functionId: 'fn-included' }],
          },
        ]),
      },
      deliveryConfigurationFeature: { findMany: vi.fn().mockResolvedValue([]), createMany },
      ...overrides,
    },
  };
}

describe('applyConfigurationParameters', () => {
  it('freezes the matching published profile and records the confirmation', async () => {
    const { db, update } = buildDb();

    await applyConfigurationParameters(db as never, {
      configurationId: 'cfg-1',
      parameters: PARAMETERS,
      actorEmployeeId: 'emp-1',
    });

    expect(update.mock.calls[0]?.[0].data).toMatchObject({
      configSize: 'CLASSIC',
      implementationBase: 'FROM_SCRATCH',
      designMode: 'AI_DESIGN',
      aiDesignerReview: false,
      baseProfileVersionId: 'profile-shop',
      checkedById: 'emp-1',
    });
  });

  it('activates the functions the profile includes in its base', async () => {
    const { db, createMany } = buildDb();

    await applyConfigurationParameters(db as never, {
      configurationId: 'cfg-1',
      parameters: PARAMETERS,
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [{ configurationId: 'cfg-1', functionId: 'fn-included', origin: 'INCLUDED' }],
    });
  });

  it('does not duplicate a function that is already on the card', async () => {
    const { db, createMany } = buildDb({
      deliveryConfigurationFeature: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ functionId: 'fn-included', origin: 'EXTRA', archivedAt: null }]),
        createMany: vi.fn(),
      },
    });

    await applyConfigurationParameters(db as never, {
      configurationId: 'cfg-1',
      parameters: PARAMETERS,
    });

    expect(createMany).not.toHaveBeenCalled();
  });

  it('says the norm is not configured when no published profile matches', async () => {
    const { db } = buildDb({
      deliveryBaseProfileVersion: { findMany: vi.fn().mockResolvedValue([]) },
    });

    await expect(
      applyConfigurationParameters(db as never, {
        configurationId: 'cfg-1',
        parameters: PARAMETERS,
      }),
    ).rejects.toMatchObject({ response: { code: 'NORMATIVE_NOT_CONFIGURED' } });
  });

  it('refuses to reclassify a card whose plan already exists', async () => {
    const { db } = buildDb({
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          scopeLockedAt: null,
          initialRevisionId: 'rev-1',
          entityKind: 'PRODUCT',
          product: { status: 'DEVELOPMENT', productType: 'ECOMMERCE', productCategory: 'CODE' },
          extension: null,
        }),
        update: vi.fn(),
      },
    });

    await expect(
      applyConfigurationParameters(db as never, {
        configurationId: 'cfg-1',
        parameters: PARAMETERS,
      }),
    ).rejects.toMatchObject({ response: { code: 'REDISTRIBUTION_REQUIRED' } });
  });

  it('refuses a legacy card', async () => {
    const { db } = buildDb({
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'LEGACY',
          scopeLockedAt: null,
          initialRevisionId: null,
          entityKind: 'PRODUCT',
          product: { status: 'DEVELOPMENT', productType: 'ECOMMERCE', productCategory: 'CODE' },
          extension: null,
        }),
        update: vi.fn(),
      },
    });

    await expect(
      applyConfigurationParameters(db as never, {
        configurationId: 'cfg-1',
        parameters: PARAMETERS,
      }),
    ).rejects.toMatchObject({ response: { code: 'LEGACY_ADOPTION_REQUIRED' } });
  });
});
