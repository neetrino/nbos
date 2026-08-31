import { describe, expect, it } from 'vitest';
import {
  uniqueAttentionLabels,
  viewedAttention,
  type ClientAttentionRow,
} from './client-attention-view';

const financeA: ClientAttentionRow = {
  productId: 'prod-a',
  purpose: 'FINANCE',
  productName: 'Site A',
  ownerKind: 'QUEUE',
  ownerQueue: 'FINANCE',
  label: 'Finance',
  isManual: false,
};

const workB: ClientAttentionRow = {
  productId: 'prod-b',
  purpose: 'WORK',
  productName: 'Site B',
  ownerKind: 'ROLE',
  ownerQueue: null,
  label: 'Product PM',
  isManual: false,
};

describe('client attention view', () => {
  it('joins unique labels so Assigned .some() stays consistent with header copy', () => {
    expect(uniqueAttentionLabels([financeA, workB])).toBe('Finance · Product PM');
    expect(uniqueAttentionLabels([financeA, { ...workB, label: 'Finance' }])).toBe('Finance');
  });

  it('selects the viewed product instead of silently using attention[0]', () => {
    expect(viewedAttention([financeA, workB], 'prod-b')?.productId).toBe('prod-b');
    expect(viewedAttention([financeA, workB], 'prod-a')?.purpose).toBe('FINANCE');
  });
});
