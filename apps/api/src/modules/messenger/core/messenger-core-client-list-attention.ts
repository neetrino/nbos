import type { ProductCommunicationPurpose } from '@nbos/database';
import {
  ATTENTION_PRODUCT_SELECT,
  type AttentionProductFacts,
} from './messenger-core-attention-default';
import { mergeAttentions } from './messenger-core-attention.ops';
import type { MessengerAttentionDto } from './messenger-core-attention.types';

type BindingInclude = {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  product: AttentionProductFacts;
};

type ManualInclude = {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  ownerKind: MessengerAttentionDto['ownerKind'];
  ownerEmployeeId: string | null;
  ownerQueue: MessengerAttentionDto['ownerQueue'];
  ownerRole: MessengerAttentionDto['ownerRole'];
};

export const CLIENT_LIST_ATTENTION_INCLUDE = {
  productCommunicationBindings: {
    where: { status: 'ACTIVE' as const },
    select: {
      conversationId: true,
      productId: true,
      purpose: true,
      product: { select: ATTENTION_PRODUCT_SELECT },
    },
  },
  attentions: {
    select: {
      conversationId: true,
      productId: true,
      purpose: true,
      ownerKind: true,
      ownerEmployeeId: true,
      ownerQueue: true,
      ownerRole: true,
    },
  },
} as const;

export function attentionsFromListRow(row: {
  id: string;
  productCommunicationBindings?: BindingInclude[];
  attentions?: ManualInclude[];
}): MessengerAttentionDto[] {
  return mergeAttentions(row.id, row.productCommunicationBindings ?? [], row.attentions ?? []);
}
