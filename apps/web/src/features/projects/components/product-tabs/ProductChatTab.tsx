'use client';

import { EntityConversationPanel } from '@/features/messenger-internal/EntityConversationPanel';

export function ProductChatTab({ productId }: { productId: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EntityConversationPanel kind="product" entityId={productId} />
    </div>
  );
}
