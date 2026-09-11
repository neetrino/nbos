'use client';

import { useState } from 'react';
import { searchEmployeesForPicker } from '@/lib/employees';

export function InternalMentionPicker({
  selected,
  onChange,
}: {
  selected: Array<{ id: string; label: string }>;
  onChange: (next: Array<{ id: string; label: string }>) => void;
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
    <div className="mb-2">
      {selected.length > 0 ? (
        <div className="mb-1 flex flex-wrap gap-1">
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
          className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-2 py-1 text-[11px] text-black placeholder:text-black/35"
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
