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
    <div className="px-3 pt-2">
      <div className="flex items-center gap-1 rounded-full bg-white py-1 pr-1 pl-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => jumpToThreadMessage(pinned.id)}
        >
          <Pin size={14} className="shrink-0 text-[#4f46e5]" />
          <span className="truncate text-xs text-[#64748b]">
            <span className="font-semibold text-[#4f46e5]">{pinned.senderName}</span>
            <span className="px-1 text-[#cbd5e1]">·</span>
            {pinned.content}
          </span>
        </button>
        {canUnpin ? (
          <button
            type="button"
            aria-label="Unpin"
            onClick={onUnpin}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
