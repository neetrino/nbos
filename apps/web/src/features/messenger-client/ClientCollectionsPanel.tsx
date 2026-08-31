'use client';

import { Folder, Plus, Star } from 'lucide-react';
import type { MessengerCoreCollectionRow } from '@/lib/api/messenger-core';
import { CLIENT_MESSENGER_EMPTY_COPY } from './client-messenger.constants';

export function ClientCollectionsPanel({
  collections,
  activeId,
  newName,
  creating,
  onNewNameChange,
  onCreatePersonal,
  onCreateShared,
  onSelect,
}: {
  collections: MessengerCoreCollectionRow[];
  activeId: string | null;
  newName: string;
  creating: boolean;
  onNewNameChange: (value: string) => void;
  onCreatePersonal: () => void;
  onCreateShared: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="border-border bg-card flex min-h-0 w-72 shrink-0 flex-col border-r">
      <div className="space-y-2 p-3">
        <input
          type="text"
          value={newName}
          onChange={(event) => onNewNameChange(event.target.value)}
          placeholder="New Client collection name"
          className="w-full rounded-lg border border-teal-900/10 bg-[#F4F7F7] px-3 py-1.5 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-teal-800/25 focus:outline-none"
        />
        <div className="flex gap-1">
          <button
            type="button"
            disabled={creating || newName.trim().length === 0}
            onClick={onCreatePersonal}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-teal-800/15 px-2 py-1.5 text-[11px] font-medium text-teal-950 disabled:opacity-40"
          >
            <Plus size={12} /> Personal
          </button>
          <button
            type="button"
            disabled={creating || newName.trim().length === 0}
            onClick={onCreateShared}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-teal-900/10 px-2 py-1.5 text-[11px] font-medium text-black/70 disabled:opacity-40"
          >
            <Plus size={12} /> Shared
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {collections.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-black/40">
            {CLIENT_MESSENGER_EMPTY_COPY.collections}
          </p>
        ) : null}
        {collections.map((collection) => {
          const active = activeId === collection.id;
          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => onSelect(collection.id)}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                active
                  ? 'bg-teal-800/10 font-medium text-teal-950'
                  : 'text-black/65 hover:bg-black/[0.03]'
              }`}
            >
              {collection.name === 'Favorites' ? (
                <Star size={15} className="fill-teal-800 text-teal-800" />
              ) : (
                <Folder size={15} className={active ? 'text-teal-800' : 'text-black/30'} />
              )}
              <span className="min-w-0 flex-1 truncate">{collection.name}</span>
              <span className="text-[10px] tracking-wide text-black/35 uppercase">
                {collection.visibility === 'SHARED' ? 'Shared' : 'Personal'}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
