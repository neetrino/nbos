'use client';

import { useState } from 'react';

export function ClientInviteDialog({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (employeeId: string) => Promise<void>;
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  async function submit() {
    const id = employeeId.trim();
    if (!id || busy) return;
    setBusy(true);
    try {
      await onInvite(id);
      setEmployeeId('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex items-end justify-end bg-black/20 p-4">
      <div className="w-80 rounded-xl border border-teal-900/15 bg-white p-4 shadow-lg">
        <h3 className="text-sm font-semibold text-black">Invite read-only specialist</h3>
        <p className="mt-1 text-[11px] text-black/50">
          Membership is READ_ONLY. Invite never grants Client SEND.
        </p>
        <input
          type="text"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          placeholder="Employee id"
          className="mt-3 w-full rounded-lg border border-teal-900/10 px-3 py-1.5 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || employeeId.trim().length === 0}
            onClick={() => void submit()}
            className="rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}
