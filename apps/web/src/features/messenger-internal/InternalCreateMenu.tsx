'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MENU_ACTION_CLASS =
  'hover:bg-muted flex w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground';

export function InternalCreateMenu({
  canEdit,
  onCreateGroup,
}: {
  canEdit: boolean;
  onCreateGroup: (title: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!canEdit) return null;

  const close = () => {
    setOpen(false);
    setNaming(false);
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setNaming(false);
      }}
    >
      <CreateMenuTrigger />
      <DropdownMenuContent align="end" className="w-56">
        {naming ? (
          <GroupNameForm
            busy={busy}
            onCreate={(title) => {
              setBusy(true);
              void onCreateGroup(title).finally(() => {
                setBusy(false);
                close();
              });
            }}
          />
        ) : (
          <button type="button" className={MENU_ACTION_CLASS} onClick={() => setNaming(true)}>
            New group
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateMenuTrigger() {
  return (
    <DropdownMenuTrigger
      render={(props) => (
        <Button
          {...props}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-[#64748b]"
          aria-label="Create group"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
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
