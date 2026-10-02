'use client';

import { MessengerPersonAvatar } from './MessengerPersonAvatar';
import type { ConversationTypingPeer } from './messenger-conversation-typing';

export function InternalTypingIndicator({ peer }: { peer: ConversationTypingPeer }) {
  return (
    <div className="flex items-end gap-3 px-5 pt-1 pb-1">
      <MessengerPersonAvatar
        employeeId={peer.employeeId}
        label={peer.label}
        sizeClassName="size-9"
        fallbackClassName="bg-[#e0e7ff] text-[#4338ca] text-xs"
      />
      <p className="text-xs text-[#64748b]">typing…</p>
    </div>
  );
}
