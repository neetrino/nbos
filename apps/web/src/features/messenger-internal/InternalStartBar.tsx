'use client';

import { useState } from 'react';
import { searchEmployeesForPicker } from '@/lib/employees';
import type { InternalMessengerSectionId } from './internal-messenger.constants';

export function InternalStartBar({
  section,
  canEdit,
  onCreateGroup,
  onStartDirect,
}: {
  section: InternalMessengerSectionId;
  canEdit: boolean;
  onCreateGroup: (title: string) => Promise<void>;
  onStartDirect: (peerEmployeeId: string) => Promise<void>;
}) {
  const [groupTitle, setGroupTitle] = useState('');
  const [peerQuery, setPeerQuery] = useState('');
  const [peers, setPeers] = useState<Array<{ value: string; label: string }>>([]);
  const [busy, setBusy] = useState(false);
  if (!canEdit || (section !== 'groups' && section !== 'direct' && section !== 'all')) return null;

  async function searchPeers(value: string) {
    setPeerQuery(value);
    if (value.trim().length === 0) {
      setPeers([]);
      return;
    }
    const rows = await searchEmployeesForPicker(value);
    setPeers(rows.slice(0, 6).map((row) => ({ value: row.value, label: row.label })));
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-black/[0.06] px-3 py-2">
      {section === 'groups' || section === 'all' ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            const title = groupTitle.trim();
            if (!title || busy) return;
            setBusy(true);
            void onCreateGroup(title).finally(() => {
              setBusy(false);
              setGroupTitle('');
            });
          }}
        >
          <input
            type="text"
            value={groupTitle}
            onChange={(event) => setGroupTitle(event.target.value)}
            placeholder="New group name"
            className="w-40 rounded-lg border border-black/[0.08] bg-white px-2 py-1 text-xs text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || groupTitle.trim().length === 0}
            className="rounded-lg bg-[#E5A84B]/20 px-2 py-1 text-[11px] font-medium text-black disabled:opacity-40"
          >
            Create group
          </button>
        </form>
      ) : null}
      {section === 'direct' || section === 'all' ? (
        <div className="relative">
          <input
            type="text"
            value={peerQuery}
            onChange={(event) => void searchPeers(event.target.value)}
            placeholder="Start a Direct message"
            className="w-48 rounded-lg border border-black/[0.08] bg-white px-2 py-1 text-xs text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
          />
          {peers.length > 0 ? (
            <div className="absolute top-full z-10 mt-1 w-48 rounded-lg border border-black/[0.08] bg-white py-1 shadow-sm">
              {peers.map((peer) => (
                <button
                  key={peer.value}
                  type="button"
                  className="block w-full px-2 py-1.5 text-left text-xs text-black hover:bg-[#E5A84B]/10"
                  onClick={() => {
                    setBusy(true);
                    void onStartDirect(peer.value).finally(() => {
                      setBusy(false);
                      setPeerQuery('');
                      setPeers([]);
                    });
                  }}
                >
                  {peer.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
