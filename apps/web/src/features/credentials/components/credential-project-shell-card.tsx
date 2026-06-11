'use client';

import { FolderKanban } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { CredentialProjectShell } from '@/lib/api/credentials';

interface CredentialProjectShellCardProps {
  shell: CredentialProjectShell;
  onOpen: (projectId: string) => void;
}

export function CredentialProjectShellCard({ shell, onOpen }: CredentialProjectShellCardProps) {
  return (
    <KanbanCardShell
      role="button"
      tabIndex={0}
      radius="lg"
      padding="none"
      hoverShadow="md"
      className={cn(
        'group/card relative flex h-full min-h-[104px] w-full cursor-pointer flex-col overflow-hidden',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
      onClick={() => onOpen(shell.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(shell.id);
        }
      }}
    >
      <span className="absolute top-0 bottom-0 left-0 w-0.5 bg-sky-500/70" aria-hidden />
      <div className="flex h-full min-h-0 flex-1 flex-col p-2.5 pl-3">
        <p className="text-foreground line-clamp-1 pr-2 text-sm leading-snug font-medium">
          {shell.name}
        </p>
        <div className="flex min-h-0 flex-1 items-center justify-center py-0.5">
          <FolderKanban
            className="size-11 shrink-0 text-sky-500/80"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <p className="text-muted-foreground truncate text-center text-[10px] leading-none">
          {shell.code} · {shell.credentialCount} credential
          {shell.credentialCount === 1 ? '' : 's'}
        </p>
      </div>
    </KanbanCardShell>
  );
}
