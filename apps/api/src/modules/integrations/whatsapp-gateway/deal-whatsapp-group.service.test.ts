import { describe, expect, it, vi } from 'vitest';
import { DealWhatsAppGroupService } from './deal-whatsapp-group.service';
import { WHATSAPP_ERROR } from './whatsapp-gateway.constants';

describe('DealWhatsAppGroupService', () => {
  it('creates a Deal-level group when Product does not exist yet', async () => {
    const prisma = {
      deal: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'deal-1',
          code: 'D-0123',
          name: 'Website',
          type: 'PRODUCT',
          contactId: 'c1',
          existingProductId: null,
          status: 'DEPOSIT_AND_CONTRACT',
          contact: { firstName: 'Ada', lastName: 'Client' },
          orders: [],
        }),
      },
      dealWhatsAppGroupBinding: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({
          id: 'bind-1',
          dealId: 'deal-1',
          groupChatId: null,
          groupName: 'D-0123 · Ada Client · Website',
          status: 'PENDING',
          lastSuccessfulSyncAt: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        }),
      },
    };
    const queue = { enqueueDealCreate: vi.fn().mockResolvedValue(true) };
    const service = new DealWhatsAppGroupService(
      prisma as never,
      { ensureGroupForProduct: vi.fn(), getProductWhatsAppState: vi.fn() } as never,
      queue as never,
      {} as never,
      {} as never,
      { log: vi.fn() } as never,
    );

    const state = await service.ensureForDealAction('deal-1', 'actor-1');

    expect(queue.enqueueDealCreate).toHaveBeenCalled();
    expect(state.source).toBe('DEAL');
    expect(state.productId).toBeNull();
    expect(state.binding?.status).toBe('PENDING');
  });

  it('uses the Product path when a Product already exists', async function ensureProductPath() {
    const ensureGroupForProduct = vi.fn().mockResolvedValue({
      productId: 'prod-1',
      binding: { id: 'pb', groupChatId: null, status: 'PENDING' },
      latestOperation: { status: 'QUEUED' },
    });
    const prisma = {
      deal: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'deal-1',
          code: 'D-1',
          name: 'Site',
          type: 'PRODUCT',
          contactId: 'c1',
          existingProductId: 'prod-1',
          status: 'WON',
          contact: { firstName: 'Ada', lastName: 'Client' },
          orders: [],
        }),
      },
    };
    const service = new DealWhatsAppGroupService(
      prisma as never,
      { ensureGroupForProduct, getProductWhatsAppState: vi.fn() } as never,
      { enqueueDealCreate: vi.fn() } as never,
      {} as never,
      {} as never,
      { log: vi.fn() } as never,
    );

    const state = await service.ensureForDealAction('deal-1', 'actor-1');
    expect(ensureGroupForProduct).toHaveBeenCalledWith(
      'prod-1',
      expect.objectContaining({ source: 'DEAL_ACTION', contextDealId: 'deal-1' }),
    );
    expect(state.source).toBe('PRODUCT');
  });

  it('rejects EXTENSION create without Product', async () => {
    const prisma = {
      deal: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'deal-1',
          code: 'D-2',
          name: 'Ext',
          type: 'EXTENSION',
          contactId: 'c1',
          existingProductId: null,
          status: 'DEPOSIT_AND_CONTRACT',
          contact: { firstName: 'Ada', lastName: 'Client' },
          orders: [],
        }),
      },
    };
    const service = new DealWhatsAppGroupService(
      prisma as never,
      { ensureGroupForProduct: vi.fn() } as never,
      { enqueueDealCreate: vi.fn() } as never,
      {} as never,
      {} as never,
      { log: vi.fn() } as never,
    );

    await expect(service.ensureForDealAction('deal-1', 'actor-1')).rejects.toMatchObject({
      response: { code: WHATSAPP_ERROR.DEAL_TYPE_NOT_ELIGIBLE },
    });
  });
});
