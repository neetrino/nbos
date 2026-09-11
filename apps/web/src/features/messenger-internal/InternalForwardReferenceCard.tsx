'use client';

import type { MessengerCoreMessageReferenceRow } from '@/lib/api/messenger-core';

const PURPOSE_FORWARD = 'FORWARD';

export function InternalForwardReferenceCard({
  references,
  onOpenOriginal,
}: {
  references: MessengerCoreMessageReferenceRow[];
  onOpenOriginal: (sourceMessageId: string) => void;
}) {
  const sources = [...references]
    .filter((row) => row.purpose === PURPOSE_FORWARD)
    .sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
      return left.sourceMessageId.localeCompare(right.sourceMessageId);
    });
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-5">
      <p className="text-[11px] text-black/40">
        Reference card · {sources.length} source{sources.length === 1 ? '' : 's'}
      </p>
      {sources.map((ref, index) => (
        <button
          key={ref.id}
          type="button"
          className="text-[11px] font-medium text-[#E5A84B] hover:underline"
          onClick={() => onOpenOriginal(ref.sourceMessageId)}
        >
          Open original{sources.length > 1 ? ` ${index + 1}` : ''}
        </button>
      ))}
    </div>
  );
}
