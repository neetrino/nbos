'use client';

import { useEffect, useState } from 'react';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { conversationListTitle } from './internal-messenger-section';

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void messengerCoreApi.listConversations({ section: 'all' }).then((result) => {
      setTargets(result.items.filter((row) => row.canWrite && row.id !== currentConversationId));
    });
  }, [currentConversationId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl border border-black/[0.08] bg-white p-4 shadow-lg">
        <h3 className="text-sm font-semibold text-black">Forward into Internal conversation</h3>
        <p className="mt-1 text-[11px] text-black/45">
          Pick an existing conversation. This does not create a new chat or thread.
        </p>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        <ForwardTargetList
          targets={targets}
          busy={busy}
          onPick={(id) => {
            setBusy(true);
            void onForward(id)
              .then(onClose)
              .catch(() => setError('Forward failed. You may not be able to write there.'))
              .finally(() => setBusy(false));
          }}
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-[11px] text-black/45 hover:text-black"
        >
          Cancel
        </button>
      </div>
    </div>
  );
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
      <p className="mt-3 py-4 text-center text-xs text-black/40">
        No writable Internal conversations.
      </p>
    );
  }
  return (
    <div className="mt-3 max-h-64 overflow-y-auto">
      {targets.map((row) => (
        <button
          key={row.id}
          type="button"
          disabled={busy}
          className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-black hover:bg-[#E5A84B]/10 disabled:opacity-40"
          onClick={() => onPick(row.id)}
        >
          {conversationListTitle(row.type, row.title, row.peerName ?? null)}
        </button>
      ))}
    </div>
  );
}
