'use client';

import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { conversationListTitle } from './internal-messenger-section';
import { PresenceDot, useEmployeeOnline } from './PresenceAvatar';

const QUICK_RAIL_LIMIT = 12;

export function InternalQuickRail({
  items,
  activeId,
  onSelect,
}: {
  items: MessengerCoreConversationRow[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const people = items.slice(0, QUICK_RAIL_LIMIT);
  if (people.length === 0) return null;
  return (
    <aside
      aria-label="Quick messages"
      className="hidden w-16 shrink-0 flex-col items-center gap-2.5 overflow-y-auto border-l border-[#f1f5f9] bg-[#fafbfc] pt-4 lg:flex"
    >
      {people.map((row) => (
        <QuickAvatar
          key={row.id}
          row={row}
          active={row.id === activeId}
          onSelect={() => onSelect(row.id)}
        />
      ))}
    </aside>
  );
}

function QuickAvatar({
  row,
  active,
  onSelect,
}: {
  row: MessengerCoreConversationRow;
  active: boolean;
  onSelect: () => void;
}) {
  const title = conversationListTitle(row.type, row.title, row.peerName ?? null);
  const online = useEmployeeOnline(row.peerEmployeeId);
  return (
    <button
      type="button"
      aria-label={title}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
      className={`relative flex size-8 items-center justify-center rounded-full text-[10px] text-[#334155] ${
        active ? 'bg-[#c7d2fe]' : 'bg-[#e2e8f0]'
      }`}
    >
      {initialsFromDisplayName(title)}
      <PresenceDot online={online} size="sm" />
    </button>
  );
}
