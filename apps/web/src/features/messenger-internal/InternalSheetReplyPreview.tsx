'use client';

import type { MessengerReplyPreview } from '@/features/messenger/reply-preview';
import { SHEET_REPLY_QUOTE_RADIUS_CLASS } from './internal-messenger.constants';

export function InternalSheetReplyPreview({
  replyTo,
  mine,
  onJump,
}: {
  replyTo: MessengerReplyPreview;
  mine: boolean;
  onJump: (id: string) => void;
}) {
  const tone = mine ? 'bg-white/15 text-white' : 'bg-primary/10 text-foreground';
  const name = mine ? 'text-white' : 'text-primary';
  const bar = mine ? 'bg-white/80' : 'bg-primary';
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onJump(replyTo.id);
      }}
      className={`mb-1 flex w-full items-stretch gap-1.5 ${SHEET_REPLY_QUOTE_RADIUS_CLASS} px-2 py-1 text-left ${tone}`}
    >
      <span className={`w-0.5 shrink-0 rounded-full ${bar}`} />
      <span className="min-w-0">
        <span className={`block truncate text-[11px] font-semibold ${name}`}>
          {replyTo.senderName}
        </span>
        <span className="block truncate text-[11px] opacity-80">
          {replyTo.content || 'Message'}
        </span>
      </span>
    </button>
  );
}
