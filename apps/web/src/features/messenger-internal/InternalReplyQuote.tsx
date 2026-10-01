'use client';

import { X } from 'lucide-react';
import {
  SHEET_BUBBLE_LARGE_RADIUS_CLASS,
  SHEET_COMPOSER_GUTTER_CLASS,
} from './internal-messenger.constants';

export function InternalReplyQuote({
  senderName,
  content,
  onClear,
}: {
  senderName: string;
  content: string;
  onClear: () => void;
}) {
  return (
    <div className={`${SHEET_COMPOSER_GUTTER_CLASS} pb-1`}>
      <div
        className={`bg-card flex min-w-0 items-center overflow-hidden ${SHEET_BUBBLE_LARGE_RADIUS_CLASS} px-3 py-2 shadow-[var(--shadow-panel)]`}
      >
        <span className="mr-2 h-8 w-0.5 shrink-0 rounded-full bg-[#4f46e5]" />
        <div className="min-w-0 flex-1">
          <p className="text-primary truncate text-xs font-semibold">{senderName}</p>
          <p className="text-muted-foreground truncate text-xs">{content}</p>
        </div>
        <button
          type="button"
          aria-label="Cancel reply"
          onClick={onClear}
          className="text-muted-foreground hover:bg-muted ml-1 flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
