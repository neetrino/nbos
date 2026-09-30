'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { conversationListTitle } from './internal-messenger-section';
import { MessengerPersonAvatar } from './MessengerPersonAvatar';

export function InternalForwardDialog({
  open,
  currentConversationId,
  onClose,
  onForward,
}: {
  open: boolean;
  currentConversationId: string;
  onClose: () => void;
  onForward: (targetConversationId: string) => Promise<void>;
}) {
  if (!open) return null;
  return (
    <ForwardDialogBody
      currentConversationId={currentConversationId}
      onClose={onClose}
      onForward={onForward}
    />
  );
}

function ForwardDialogBody({
  currentConversationId,
  onClose,
  onForward,
}: {
  currentConversationId: string;
  onClose: () => void;
  onForward: (targetConversationId: string) => Promise<void>;
}) {
  const [targets, setTargets] = useState<MessengerCoreConversationRow[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtered = useFilteredForwardTargets(targets, query);

  useEffect(() => {
    void messengerCoreApi.listConversations({ section: 'all' }).then((result) => {
      setTargets(result.items.filter((row) => row.canWrite && row.id !== currentConversationId));
    });
  }, [currentConversationId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex max-h-[min(32rem,80vh)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(15,23,42,0.22)]">
        <header className="shrink-0 border-b border-[#e2e8f0] px-4 pt-4 pb-3">
          <h3 className="text-base font-semibold text-[#0f172a]">Forward</h3>
          <ForwardSearch query={query} onQuery={setQuery} />
          {error ? <p className="mt-2 text-xs text-[#dc2626]">{error}</p> : null}
        </header>
        <ForwardTargetList
          targets={filtered}
          busy={busy}
          onPick={(id) => {
            setBusy(true);
            void onForward(id)
              .then(onClose)
              .catch(() => setError('Forward failed. You may not be able to write there.'))
              .finally(() => setBusy(false));
          }}
        />
        <div className="flex shrink-0 justify-end border-t border-[#e2e8f0] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ForwardSearch({ query, onQuery }: { query: string; onQuery: (value: string) => void }) {
  return (
    <label className="mt-3 flex items-center gap-2 rounded-xl bg-[#f1f5f9] px-3 py-2">
      <Search size={16} className="shrink-0 text-[#94a3b8]" />
      <input
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search"
        className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
      />
    </label>
  );
}

function useFilteredForwardTargets(targets: MessengerCoreConversationRow[], query: string) {
  const needle = query.trim().toLowerCase();
  return useMemo(() => {
    if (!needle) return targets;
    return targets.filter((row) => {
      const title = conversationListTitle(row.type, row.title, row.peerName ?? null).toLowerCase();
      return title.includes(needle);
    });
  }, [needle, targets]);
}

function ForwardTargetList({
  targets,
  busy,
  onPick,
}: {
  targets: MessengerCoreConversationRow[];
  busy: boolean;
  onPick: (id: string) => void;
}) {
  if (targets.length === 0) {
    return (
      <p className="flex-1 px-4 py-8 text-center text-sm text-[#94a3b8]">No conversations found.</p>
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {targets.map((row) => (
        <ForwardTargetRow key={row.id} row={row} busy={busy} onPick={onPick} />
      ))}
    </div>
  );
}

function ForwardTargetRow({
  row,
  busy,
  onPick,
}: {
  row: MessengerCoreConversationRow;
  busy: boolean;
  onPick: (id: string) => void;
}) {
  const title = conversationListTitle(row.type, row.title, row.peerName ?? null);
  const direct = row.type === 'DIRECT';
  const fallback = direct ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e0e7ff] text-[#4338ca]';
  return (
    <button
      type="button"
      disabled={busy}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f8fafc] disabled:opacity-40"
      onClick={() => onPick(row.id)}
    >
      <MessengerPersonAvatar
        employeeId={row.peerEmployeeId}
        label={title}
        sizeClassName="size-11"
        fallbackClassName={fallback}
        roundedClassName={direct ? 'rounded-full' : 'rounded-xl'}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#0f172a]">{title}</span>
        <span className="block truncate text-xs text-[#64748b]">
          {row.lastMessagePreview?.trim() || (direct ? 'Direct message' : 'Group')}
        </span>
      </span>
    </button>
  );
}
