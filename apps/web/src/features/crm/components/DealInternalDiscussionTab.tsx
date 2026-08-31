'use client';

import { EntityConversationPanel } from '@/features/messenger-internal/EntityConversationPanel';

export function DealInternalDiscussionTab({ dealId }: { dealId: string }) {
  return (
    <div className="flex min-h-[28rem] min-w-0 flex-1 flex-col">
      <EntityConversationPanel kind="deal" entityId={dealId} />
    </div>
  );
}
