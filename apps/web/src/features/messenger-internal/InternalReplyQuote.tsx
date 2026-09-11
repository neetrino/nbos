'use client';

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
    <div className="mb-2 flex items-start justify-between rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-black/50">Replying to {senderName}</p>
        <p className="truncate text-xs text-black/70">{content}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-2 shrink-0 text-[11px] text-black/40 hover:text-black"
      >
        Cancel
      </button>
    </div>
  );
}
