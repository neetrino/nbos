import type { ProductCommunicationPurpose } from '@nbos/database';

export type MessengerAttentionOwnerKind = 'EMPLOYEE' | 'QUEUE' | 'ROLE';

export type MessengerAttentionQueue = 'SUPPORT_INTAKE' | 'FINANCE';

export type MessengerAttentionDto = {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  productName: string;
  ownerKind: MessengerAttentionOwnerKind;
  ownerEmployeeId: string | null;
  ownerQueue: MessengerAttentionQueue | null;
  ownerRole: 'PRODUCT_PM' | null;
  isManual: boolean;
  label: string;
};
