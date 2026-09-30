'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function InternalCreateMenu({
  onCreateGroup,
  variant = 'icon',
}: {
  onCreateGroup: (title: string) => Promise<void>;
  variant?: 'icon' | 'button';
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <CreateGroupTrigger variant={variant} />
      <DropdownMenuContent align="end" className="w-56">
        <GroupNameForm
          busy={busy}
          onCreate={(title) => {
            setBusy(true);
            void onCreateGroup(title).finally(() => {
              setBusy(false);
              setOpen(false);
            });
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateGroupTrigger({ variant }: { variant: 'icon' | 'button' }) {
  return (
    <DropdownMenuTrigger
      render={(props) => (
        <button
          {...props}
          type="button"
          aria-label="Create group"
          className={
            variant === 'button'
              ? 'inline-flex items-center gap-2 rounded-full bg-[#4f46e5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca]'
              : 'flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] hover:text-[#4f46e5]'
          }
        >
          <Plus size={variant === 'button' ? 16 : 18} aria-hidden />
          {variant === 'button' ? 'Create group' : null}
        </button>
      )}
    />
  );
}

function GroupNameForm({ busy, onCreate }: { busy: boolean; onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('');
  return (
    <form
      className="flex flex-col gap-2 p-1"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const name = title.trim();
        if (!name || busy) return;
        onCreate(name);
      }}
    >
      <input
        type="text"
        value={title}
        autoFocus
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Group name"
        aria-label="Group name"
        className="rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm text-black placeholder:text-black/35 focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || title.trim().length === 0}
        className="bg-primary text-primary-foreground rounded-lg px-2 py-1.5 text-sm disabled:opacity-40"
      >
        Create group
      </button>
    </form>
  );
}
