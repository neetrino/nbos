'use client';

import { useState } from 'react';
import { searchEmployeesForPicker } from '@/lib/employees';

export function InternalMentionPicker({
  selected,
  onChange,
  inline = false,
}: {
  selected: Array<{ id: string; label: string }>;
  onChange: (next: Array<{ id: string; label: string }>) => void;
  inline?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [peers, setPeers] = useState<Array<{ value: string; label: string }>>([]);

  async function search(value: string) {
    setQuery(value);
    if (value.trim().length === 0) {
      setPeers([]);
      return;
    }
    const rows = await searchEmployeesForPicker(value);
    setPeers(rows.slice(0, 6).map((row) => ({ value: row.value, label: row.label })));
  }

  return (
    <div className={inline ? 'min-w-0 flex-1' : 'mb-2'}>
      {selected.length > 0 ? (
        <div className={`flex flex-wrap gap-1 ${inline ? 'mb-1 justify-end' : 'mb-1'}`}>
          {selected.map((employee) => (
            <button
              key={employee.id}
              type="button"
              className="rounded-full bg-[#E5A84B]/15 px-2 py-0.5 text-[11px] text-black"
              onClick={() => onChange(selected.filter((row) => row.id !== employee.id))}
            >
              @{employee.label} ×
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => void search(event.target.value)}
          placeholder="Mention an employee"
          className={
            inline
              ? 'w-full rounded-2xl border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#0f172a] shadow-[0px_4px_2px_rgba(148,163,184,0.1)] placeholder:text-[#94a3b8] focus:outline-none'
              : 'w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-2 py-1 text-[11px] text-black placeholder:text-black/35'
          }
        />
        {peers.length > 0 ? (
          <div className="absolute bottom-full z-10 mb-1 w-full rounded-lg border border-black/[0.08] bg-white py-1 shadow-sm">
            {peers.map((peer) => (
              <button
                key={peer.value}
                type="button"
                className="block w-full px-2 py-1.5 text-left text-xs text-black hover:bg-[#E5A84B]/10"
                onClick={() => {
                  if (!selected.some((row) => row.id === peer.value)) {
                    onChange([...selected, { id: peer.value, label: peer.label }]);
                  }
                  setQuery('');
                  setPeers([]);
                }}
              >
                {peer.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
