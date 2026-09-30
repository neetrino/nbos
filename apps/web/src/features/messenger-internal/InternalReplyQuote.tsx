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
    <div className={`${SHEET_COMPOSER_GUTTER_CLASS} flex items-center gap-2 pb-1`}>
      <div
        className={`flex min-w-0 flex-1 items-stretch overflow-hidden ${SHEET_BUBBLE_LARGE_RADIUS_CLASS} bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]`}
      >
        <span className="mr-2 w-0.5 shrink-0 rounded-full bg-[#4f46e5]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#4f46e5]">{senderName}</p>
          <p className="truncate text-xs text-[#64748b]">{content}</p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Cancel reply"
        onClick={onClear}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
