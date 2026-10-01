'use client';

import { Folder, Plus, Star } from 'lucide-react';
import type { MessengerCoreCollectionRow } from '@/lib/api/messenger-core';
import { INTERNAL_MESSENGER_EMPTY_COPY } from './internal-messenger.constants';

export function InternalCollectionsPanel({
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
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex min-h-0 w-80 max-w-[46%] shrink-0 flex-col border-r">
      <div className="space-y-2 p-3">
        <input
          type="text"
          value={newName}
          onChange={(event) => onNewNameChange(event.target.value)}
          placeholder="New collection name"
          className="border-sidebar-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none"
        />
        <div className="flex gap-1">
          <button
            type="button"
            disabled={creating || newName.trim().length === 0}
            onClick={onCreatePersonal}
            className="text-foreground flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#E5A84B]/15 px-2 py-1.5 text-[11px] font-medium disabled:opacity-40"
          >
            <Plus size={12} /> Personal
          </button>
          <button
            type="button"
            disabled={creating || newName.trim().length === 0}
            onClick={onCreateShared}
            className="border-sidebar-border text-sidebar-foreground/80 flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium disabled:opacity-40"
          >
            <Plus size={12} /> Shared
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {collections.length === 0 ? (
          <p className="text-sidebar-muted px-2 py-6 text-center text-xs leading-relaxed">
            {INTERNAL_MESSENGER_EMPTY_COPY.collections}
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
                  ? 'text-foreground bg-[#E5A84B]/15 font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-white/5'
              }`}
            >
              {collection.name === 'Favorites' ? (
                <Star size={15} className="fill-[#E5A84B] text-[#E5A84B]" />
              ) : (
                <Folder size={15} className={active ? 'text-[#E5A84B]' : 'text-sidebar-muted'} />
              )}
              <span className="min-w-0 flex-1 truncate">{collection.name}</span>
              <span className="text-sidebar-muted text-[10px] tracking-wide uppercase">
                {collection.visibility === 'SHARED' ? 'Shared' : 'Personal'}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
