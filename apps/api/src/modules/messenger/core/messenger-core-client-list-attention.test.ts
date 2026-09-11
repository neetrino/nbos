import { describe, expect, it } from 'vitest';
import {
  ATTENTION_PRODUCT_SELECT,
  type AttentionProductFacts,
} from './messenger-core-attention-default';
import {
  attentionsFromListRow,
  CLIENT_LIST_ATTENTION_INCLUDE,
} from './messenger-core-client-list-attention';

describe('FINDING-S10-01 Client Inbox list Hub formula', () => {
  it('reuses ATTENTION_PRODUCT_SELECT and does not select Product.status', () => {
    const productSelect =
      CLIENT_LIST_ATTENTION_INCLUDE.productCommunicationBindings.select.product.select;
    expect(productSelect).toBe(ATTENTION_PRODUCT_SELECT);
    expect(productSelect).not.toHaveProperty('status');
    expect(productSelect.subscriptions.select).toEqual({ type: true, status: true });
  });

  it('labels WORK with MAINTENANCE_ONLY ACTIVE as Support Intake via list include', () => {
    const rows = attentionsFromListRow(
      listIncludeRow({
        id: 'prod-1',
        pmId: 'pm-1',
        name: 'Site',
        subscriptions: [{ type: 'MAINTENANCE_ONLY', status: 'ACTIVE' }],
      }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ownerQueue).toBe('SUPPORT_INTAKE');
    expect(rows[0]?.ownerKind).toBe('QUEUE');
    expect(rows[0]?.label).toBe('Support Intake');
  });

  it('labels WORK with no live maintenance (DONE or any status) as Product PM via list include', () => {
    const rows = attentionsFromListRow(
      listIncludeRow({
        id: 'prod-1',
        pmId: 'pm-1',
        name: 'Site',
        subscriptions: [],
      }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ownerRole).toBe('PRODUCT_PM');
    expect(rows[0]?.ownerEmployeeId).toBe('pm-1');
    expect(rows[0]?.ownerQueue).toBeNull();
    expect(rows[0]?.label).toBe('Product PM');
  });
});

function listIncludeRow(product: AttentionProductFacts) {
  return {
    id: 'conv-work',
    productCommunicationBindings: [
      {
        conversationId: 'conv-work',
        productId: product.id,
        purpose: 'WORK' as const,
        product,
      },
    ],
    attentions: [],
  };
}
