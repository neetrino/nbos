import { describe, expect, it, vi } from 'vitest';
import { computeDefaultAttention } from './messenger-core-attention-default';
import { attentionAssignsEmployee, mergeAttentions } from './messenger-core-attention.ops';
import { attachTicketSourceReferences } from './messenger-core-ticket-source.ops';
import { listTicketSourceReferences } from './messenger-core-ticket-source-list.ops';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Slice 10 attention routing', () => {
  it('keeps conversation id when Delivery WORK becomes Hub Maintenance Support Intake', () => {
    const conversationId = 'conv-work';
    const productId = 'prod-1';
    const delivery = computeDefaultAttention({
      conversationId,
      productId,
      purpose: 'WORK',
      product: productFacts(productId, []),
    });
    const maintenance = computeDefaultAttention({
      conversationId,
      productId,
      purpose: 'WORK',
      product: productFacts(productId, [{ type: 'MAINTENANCE_ONLY', status: 'ACTIVE' }]),
    });
    expect(delivery.conversationId).toBe(conversationId);
    expect(maintenance.conversationId).toBe(conversationId);
    expect(delivery.ownerRole).toBe('PRODUCT_PM');
    expect(delivery.ownerEmployeeId).toBe('pm-1');
    expect(maintenance.ownerQueue).toBe('SUPPORT_INTAKE');
    expect(maintenance.ownerKind).toBe('QUEUE');
  });

  it('keeps Product PM for a closed product with no live maintenance subscription', () => {
    const conversationId = 'conv-work';
    const row = computeDefaultAttention({
      conversationId,
      productId: 'prod-1',
      purpose: 'WORK',
      product: productFacts('prod-1', []),
    });
    expect(row.conversationId).toBe(conversationId);
    expect(row.ownerRole).toBe('PRODUCT_PM');
    expect(row.ownerQueue).toBeNull();
  });

  it.each([
    ['MAINTENANCE_ONLY', 'ACTIVE'],
    ['MAINTENANCE_ONLY', 'PENDING'],
    ['DEV_AND_MAINTENANCE', 'ACTIVE'],
    ['DEV_AND_MAINTENANCE', 'PENDING'],
  ] as const)('routes non-closed WORK with %s %s to Support Intake', (type, status) => {
    const conversationId = 'conv-work';
    const row = computeDefaultAttention({
      conversationId,
      productId: 'prod-1',
      purpose: 'WORK',
      product: productFacts('prod-1', [{ type, status }]),
    });
    expect(row.conversationId).toBe(conversationId);
    expect(row.ownerQueue).toBe('SUPPORT_INTAKE');
    expect(row.ownerKind).toBe('QUEUE');
  });

  it.each([
    ['MAINTENANCE_ONLY', 'ON_HOLD'],
    ['MAINTENANCE_ONLY', 'CANCELLED'],
    ['MAINTENANCE_ONLY', 'COMPLETED'],
    ['DEV_ONLY', 'ACTIVE'],
  ] as const)('keeps Product PM for %s %s', (type, status) => {
    const row = computeDefaultAttention({
      conversationId: 'conv-work',
      productId: 'prod-1',
      purpose: 'WORK',
      product: productFacts('prod-1', [{ type, status }]),
    });
    expect(row.ownerRole).toBe('PRODUCT_PM');
    expect(row.ownerQueue).toBeNull();
  });

  it('routes explicit FINANCE to the Finance queue and does not hard-code an employee', () => {
    const row = computeDefaultAttention({
      conversationId: 'conv-f',
      productId: 'prod-1',
      purpose: 'FINANCE',
      product: productFacts('prod-1', []),
    });
    expect(row.ownerQueue).toBe('FINANCE');
    expect(row.ownerEmployeeId).toBeNull();
    expect(row.ownerKind).toBe('QUEUE');
  });

  it('lets one shared FINANCE conversation keep per-product Finance queue attention', () => {
    const conversationId = 'conv-shared-f';
    const merged = mergeAttentions(
      conversationId,
      [binding(conversationId, 'prod-a', 'FINANCE'), binding(conversationId, 'prod-b', 'FINANCE')],
      [],
    );
    expect(merged).toHaveLength(2);
    expect(merged.every((row) => row.conversationId === conversationId)).toBe(true);
    expect(merged.every((row) => row.ownerQueue === 'FINANCE')).toBe(true);
  });

  it('treats Support Intake queue membership as assigned attention without a named employee owner', () => {
    const row = computeDefaultAttention({
      conversationId: 'conv-work',
      productId: 'prod-1',
      purpose: 'WORK',
      product: productFacts('prod-1', [{ type: 'MAINTENANCE_ONLY', status: 'ACTIVE' }]),
    });
    expect(attentionAssignsEmployee(row, 'support-lead', new Set(['support-lead']))).toBe(true);
    expect(attentionAssignsEmployee(row, 'pm-1', new Set(['support-lead']))).toBe(false);
  });

  it('resolves a Product PM ROLE override to product.pmId at read time', () => {
    const conversationId = 'conv-work';
    const merged = mergeAttentions(
      conversationId,
      [binding(conversationId, 'prod-1', 'WORK')],
      [
        {
          conversationId,
          productId: 'prod-1',
          purpose: 'WORK',
          ownerKind: 'ROLE',
          ownerEmployeeId: null,
          ownerQueue: null,
          ownerRole: 'PRODUCT_PM',
        },
      ],
    );
    expect(merged[0]?.ownerEmployeeId).toBe('pm-1');
    expect(merged[0]?.isManual).toBe(true);
    expect(attentionAssignsEmployee(merged[0]!, 'pm-1', new Set())).toBe(true);
  });

  it('keeps the Product PM in Assigned after Intake then Product PM reassign', () => {
    const conversationId = 'conv-work';
    const bindings = [binding(conversationId, 'prod-1', 'WORK')];
    const afterIntake = mergeAttentions(conversationId, bindings, [
      {
        conversationId,
        productId: 'prod-1',
        purpose: 'WORK',
        ownerKind: 'QUEUE',
        ownerEmployeeId: null,
        ownerQueue: 'SUPPORT_INTAKE',
        ownerRole: null,
      },
    ]);
    expect(attentionAssignsEmployee(afterIntake[0]!, 'pm-1', new Set(['intake']))).toBe(false);
    const afterPm = mergeAttentions(conversationId, bindings, [
      {
        conversationId,
        productId: 'prod-1',
        purpose: 'WORK',
        ownerKind: 'ROLE',
        ownerEmployeeId: null,
        ownerQueue: null,
        ownerRole: 'PRODUCT_PM',
      },
    ]);
    expect(attentionAssignsEmployee(afterPm[0]!, 'pm-1', new Set(['intake']))).toBe(true);
  });
});

describe('Slice 10 ticket source access', () => {
  it('does not copy source history and hides preview without Client READ', async () => {
    const prisma = {
      supportTicket: { findUnique: vi.fn().mockResolvedValue({ id: 't1' }) },
      messengerMessage: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: 'src-1', conversationId: 'client-1', content: 'secret', createdAt: new Date() },
          ]),
        findUnique: vi.fn().mockResolvedValue({ id: 'src-1', conversationId: 'client-1' }),
      },
      messengerMessageReference: {
        create: vi.fn().mockResolvedValue({ id: 'ref-1', sourceMessageId: 'src-1' }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'ref-1',
            sourceMessageId: 'src-1',
            sourceConversationId: 'client-1',
            sortOrder: 0,
            sourceMessage: { content: 'secret client body', deletedAt: null },
          },
        ]),
      },
    };
    const attached = await attachTicketSourceReferences(prisma as never, {
      sourceMessageIds: ['src-1'],
      ticketId: 't1',
      createdById: 'e1',
    });
    expect(attached.createdConversation).toBe(false);
    expect(prisma.messengerMessageReference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purpose: 'TICKET_SOURCE',
          entityType: 'TICKET',
          sourceMessageId: 'src-1',
        }),
      }),
    );

    const denied = await listTicketSourceReferences(prisma as never, 't1', async () => false);
    expect(denied[0]?.preview).toBeNull();
    expect(denied[0]?.canOpen).toBe(false);
    const allowed = await listTicketSourceReferences(prisma as never, 't1', async () => true);
    expect(allowed[0]?.preview).toBe('secret client body');
    expect(allowed[0]?.canOpen).toBe(true);
  });
});

describe('Slice 10 Support Ticket has no Public/Internal composer', () => {
  it('does not expose a Ticket composer toggle on Support or Client Messenger surfaces', () => {
    const root = process.cwd();
    const files = [
      'apps/web/src/features/support/components/support-ticket-detail-general-tab.tsx',
      'apps/web/src/features/support/components/support-ticket-detail-activity-tab.tsx',
      'apps/web/src/features/support/components/SupportCreateTicketDialog.tsx',
      'apps/web/src/features/support/components/SupportTicketSourceMessages.tsx',
      'apps/web/src/features/messenger-client/ClientConversationThread.tsx',
      'apps/web/src/features/messenger-client/ClientTicketFromMessages.tsx',
      'apps/web/src/features/messenger-client/ClientLinkTicketDialog.tsx',
      'apps/web/src/features/messenger-client/ClientLockedComposer.tsx',
    ];
    for (const relative of files) {
      const text = readFileSync(path.join(root, relative), 'utf8');
      expect(text).not.toMatch(/Public\s*\|\s*Internal|Internal\s*\|\s*Public/);
      expect(text).not.toMatch(/publicComposer|sendMode|Public updates/);
    }
  });
});

function productFacts(id: string, subscriptions: Array<{ type: string; status: string }>) {
  return { id, pmId: 'pm-1', name: id === 'prod-1' ? 'Site' : id, subscriptions };
}

function binding(conversationId: string, productId: string, purpose: 'WORK' | 'FINANCE') {
  return {
    conversationId,
    productId,
    purpose,
    product: productFacts(productId, []),
  };
}
