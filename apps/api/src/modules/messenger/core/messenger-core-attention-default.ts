import type { ProductCommunicationPurpose } from '@nbos/database';
import {
  isProductOnMaintenance,
  type ProductMaintenanceSubscriptionFacts,
} from '../../projects/product-maintenance-view';
import {
  MESSENGER_ATTENTION_OWNER_QUEUE,
  MESSENGER_ATTENTION_OWNER_ROLE,
  MESSENGER_ATTENTION_QUEUE_FINANCE,
  MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
  MESSENGER_ATTENTION_ROLE_PRODUCT_PM,
} from './messenger-core-attention.constants';
import type { MessengerAttentionDto } from './messenger-core-attention.types';
import { PRODUCT_COMMUNICATION_PURPOSE_FINANCE } from './product-communication.constants';

export type AttentionProductFacts = {
  id: string;
  pmId: string | null;
  name: string;
  subscriptions: readonly ProductMaintenanceSubscriptionFacts[];
};

export const ATTENTION_PRODUCT_SELECT = {
  id: true,
  pmId: true,
  name: true,
  subscriptions: { select: { type: true, status: true } },
} as const;

export function computeDefaultAttention(input: {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  product: AttentionProductFacts | null;
}): MessengerAttentionDto {
  if (input.purpose === PRODUCT_COMMUNICATION_PURPOSE_FINANCE) {
    return financeQueueAttention(input);
  }
  if (isProductOnMaintenance(input.product?.subscriptions ?? [])) {
    return supportIntakeAttention(input);
  }
  return productPmAttention(input);
}

export function attentionLabel(row: Omit<MessengerAttentionDto, 'label'>): string {
  if (row.ownerKind === MESSENGER_ATTENTION_OWNER_QUEUE) {
    if (row.ownerQueue === MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE) return 'Support Intake';
    return 'Finance';
  }
  if (row.ownerKind === MESSENGER_ATTENTION_OWNER_ROLE) return 'Product PM';
  return 'Assigned';
}

function financeQueueAttention(input: {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  product: AttentionProductFacts | null;
}): MessengerAttentionDto {
  const base = {
    conversationId: input.conversationId,
    productId: input.productId,
    purpose: input.purpose,
    productName: input.product?.name ?? '',
    ownerKind: MESSENGER_ATTENTION_OWNER_QUEUE,
    ownerEmployeeId: null,
    ownerQueue: MESSENGER_ATTENTION_QUEUE_FINANCE,
    ownerRole: null,
    isManual: false,
  } as const;
  return { ...base, label: attentionLabel(base) };
}

function supportIntakeAttention(input: {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  product: AttentionProductFacts | null;
}): MessengerAttentionDto {
  const base = {
    conversationId: input.conversationId,
    productId: input.productId,
    purpose: input.purpose,
    productName: input.product?.name ?? '',
    ownerKind: MESSENGER_ATTENTION_OWNER_QUEUE,
    ownerEmployeeId: null,
    ownerQueue: MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
    ownerRole: null,
    isManual: false,
  } as const;
  return { ...base, label: attentionLabel(base) };
}

function productPmAttention(input: {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  product: AttentionProductFacts | null;
}): MessengerAttentionDto {
  const base = {
    conversationId: input.conversationId,
    productId: input.productId,
    purpose: input.purpose,
    productName: input.product?.name ?? '',
    ownerKind: MESSENGER_ATTENTION_OWNER_ROLE,
    ownerEmployeeId: input.product?.pmId ?? null,
    ownerQueue: null,
    ownerRole: MESSENGER_ATTENTION_ROLE_PRODUCT_PM,
    isManual: false,
  } as const;
  return { ...base, label: attentionLabel(base) };
}
