'use client';

import { Pin, X } from 'lucide-react';
import { jumpToThreadMessage } from './jump-to-thread-message';

export function InternalPinnedMessageBar({
  pinned,
  canUnpin,
  onUnpin,
}: {
  pinned: { id: string; senderName: string; content: string };
  canUnpin: boolean;
  onUnpin: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[#e2e8f0] bg-white px-4 py-2">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={() => jumpToThreadMessage(pinned.id)}
      >
        <Pin size={14} className="shrink-0 text-[#4f46e5]" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-[#4f46e5]">
            {pinned.senderName}
          </span>
          <span className="block truncate text-xs text-[#64748b]">{pinned.content}</span>
        </span>
      </button>
      {canUnpin ? (
        <button
          type="button"
          aria-label="Unpin"
          onClick={onUnpin}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#0f172a]"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
