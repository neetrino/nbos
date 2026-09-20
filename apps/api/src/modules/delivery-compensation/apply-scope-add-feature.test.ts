import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { applyScopeAddFeature } from './apply-scope-add-feature';

describe('applyScopeAddFeature', () => {
  it('restores an archived feature without creating a second BonusEntry (L10)', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          orderId: 'order-1',
          initialRevisionId: 'rev-1',
          draftVersion: 1,
          currentRevision: { sequence: 1 },
          features: [{ id: 'feat-1', functionId: 'fn-1', origin: 'EXTRA', archivedAt: new Date() }],
          baseProfileVersion: { roleUnits: [], includedFunctions: [] },
          order: { id: 'order-1', projectId: 'proj-1' },
        }),
      },
      deliveryConfigurationFeature: {
        update: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({ id: 'feat-1', origin: 'EXTRA', components: [] }),
      },
      bonusEntry: { create: vi.fn() },
    };

    await expect(
      applyScopeAddFeature(db as never, {
        configurationId: 'cfg-1',
        functionId: 'fn-1',
        expectedRevision: 1,
        actorEmployeeId: 'actor-1',
        reason: 'restore extra',
      }),
    ).resolves.toEqual({ createdBonusEntryIds: [], orderId: 'order-1' });
    expect(db.deliveryConfigurationFeature.update).toHaveBeenCalled();
    expect(db.bonusEntry.create).not.toHaveBeenCalled();
  });

  it('sets origin from the frozen profile, not the client', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'feat-2', functionId: 'fn-included' });
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          orderId: 'order-1',
          initialRevisionId: null,
          draftVersion: 1,
          currentRevision: null,
          features: [],
          baseProfileVersion: {
            roleUnits: [],
            includedFunctions: [{ functionId: 'fn-included' }],
          },
          order: { id: 'order-1', projectId: 'proj-1' },
          product: { productType: 'ECOMMERCE' },
          extension: null,
        }),
      },
      deliveryFunctionTier: { findMany: vi.fn().mockResolvedValue([]) },
      deliveryConfigurationFeature: { create, findUnique: vi.fn(), update: vi.fn() },
    };

    await applyScopeAddFeature(db as never, {
      configurationId: 'cfg-1',
      functionId: 'fn-included',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ origin: 'INCLUDED', tierId: null }),
      }),
    );
  });

  it('refuses a scope change once the parent card is closed, under the row lock', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'cfg-1',
      mode: 'V2',
      product: { status: 'DONE' },
      extension: null,
    });
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: { findUnique },
    };

    await expect(
      applyScopeAddFeature(db as never, { configurationId: 'cfg-1', functionId: 'fn-1' }),
    ).rejects.toMatchObject({ response: { code: 'FINANCIAL_ALLOCATION_LOCKED' } });
    expect(db.$queryRaw).toHaveBeenCalledBefore(findUnique);
  });

  it('rejects a stale expectedRevision (L09)', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
      deliveryConfiguration: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cfg-1',
          mode: 'V2',
          initialRevisionId: 'rev-1',
          draftVersion: 1,
          currentRevision: { sequence: 2 },
          features: [],
        }),
      },
    };

    await expect(
      applyScopeAddFeature(db as never, {
        configurationId: 'cfg-1',
        functionId: 'fn-1',
        expectedRevision: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('applyScopeAddFeature gradations', () => {
  function buildDb(
    tiers: Array<{ id: string; position: number; productTypes: Array<{ productType: string }> }>,
  ) {
    const create = vi.fn().mockResolvedValue({ id: 'feat-3', functionId: 'fn-lang' });
    return {
      create,
      db: {
        $queryRaw: vi.fn().mockResolvedValue([{ id: 'cfg-1' }]),
        deliveryConfiguration: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'cfg-1',
            mode: 'V2',
            orderId: 'order-1',
            initialRevisionId: null,
            draftVersion: 1,
            currentRevision: null,
            features: [],
            baseProfileVersion: { roleUnits: [], includedFunctions: [] },
            order: { id: 'order-1', projectId: 'proj-1' },
            product: { productType: 'CRM' },
            extension: null,
          }),
        },
        deliveryFunctionTier: { findMany: vi.fn().mockResolvedValue(tiers) },
        deliveryConfigurationFeature: { create, findUnique: vi.fn(), update: vi.fn() },
      },
    };
  }

  it('records the gradation resolved from the product type', async () => {
    const { db, create } = buildDb([
      { id: 'tier-site', position: 1, productTypes: [{ productType: 'LANDING' }] },
      { id: 'tier-system', position: 2, productTypes: [{ productType: 'CRM' }] },
    ]);

    await applyScopeAddFeature(db as never, { configurationId: 'cfg-1', functionId: 'fn-lang' });

    expect(create.mock.calls[0]?.[0].data).toMatchObject({ tierId: 'tier-system' });
  });

  it('refuses the selection when no gradation fits the product', async () => {
    const { db } = buildDb([
      { id: 'tier-site', position: 1, productTypes: [{ productType: 'LANDING' }] },
    ]);

    await expect(
      applyScopeAddFeature(db as never, { configurationId: 'cfg-1', functionId: 'fn-lang' }),
    ).rejects.toMatchObject({ response: { code: 'FUNCTION_TIER_REQUIRED' } });
  });
});
