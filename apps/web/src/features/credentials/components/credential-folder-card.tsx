'use client';

import { useState } from 'react';
import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { KanbanCardShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CredentialFolderNameDialog } from '@/features/credentials/components/credential-folder-name-dialog';
import type { CredentialFolder } from '@/lib/api/credentials';
import type { CredentialFolderDropHandlers } from '@/features/credentials/utils/credential-vault-drag';

const FOLDER_MENU_HOVER =
  'opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100';

interface CredentialFolderCardProps {
  folder: CredentialFolder;
  childFolderCount: number;
  canManage: boolean;
  onOpen: (folderId: string) => void;
  onRename: (folderId: string, name: string) => Promise<void>;
  onDelete: (folderId: string) => Promise<void>;
  dropHighlight?: boolean;
  /** Visual hint while a credential card is dragged over the folders grid. */
  dropState?: 'idle' | 'valid' | 'invalid';
  dropHandlers?: CredentialFolderDropHandlers;
}

function formatFolderCounts(credentialCount: number, childFolderCount: number): string {
  const parts: string[] = [];
  if (childFolderCount > 0) {
    parts.push(`${childFolderCount} folder${childFolderCount === 1 ? '' : 's'}`);
  }
  parts.push(`${credentialCount} credential${credentialCount === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export function CredentialFolderCard({
  folder,
  childFolderCount,
  canManage,
  onOpen,
  onRename,
  onDelete,
  dropHighlight = false,
  dropState = 'idle',
  dropHandlers,
}: CredentialFolderCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRename = async (name: string) => {
    if (!name) {
      toast.error('Folder name is required');
      return;
    }
    setBusy(true);
    try {
      await onRename(folder.id, name);
      toast.success('Folder renamed');
      setRenameOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder could not be renamed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(folder.id);
      toast.success('Folder deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder could not be deleted');
    } finally {
      setBusy(false);
    }
  };

  const dropInvalid = dropState === 'invalid';
  const dropValid = dropState === 'valid';

  return (
    <>
      <div
        className={cn(
          'transition-[opacity,filter] duration-150',
          dropInvalid && 'cursor-not-allowed opacity-40 grayscale',
          dropValid && dropHighlight && 'ring-primary rounded-lg ring-2 ring-offset-2',
        )}
        onDragOver={dropHandlers?.onDragOver}
        onDragLeave={dropHandlers?.onDragLeave}
        onDrop={dropHandlers?.onDrop}
        aria-disabled={dropInvalid || undefined}
      >
        <KanbanCardShell
          role="button"
          tabIndex={dropInvalid ? -1 : 0}
          radius="lg"
          padding="none"
          hoverShadow={dropInvalid ? 'none' : 'md'}
          className={cn(
            'group/card relative flex h-full min-h-[104px] w-full flex-col overflow-hidden',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            dropInvalid ? 'cursor-not-allowed' : 'w-full cursor-pointer',
          )}
          onClick={() => {
            if (dropInvalid) return;
            onOpen(folder.id);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpen(folder.id);
            }
          }}
        >
          <span
            className={cn(
              'absolute top-0 bottom-0 left-0 w-0.5',
              dropInvalid ? 'bg-muted-foreground/35' : 'bg-amber-500/70',
            )}
            aria-hidden
          />
          {canManage && !dropInvalid ? (
            <div className={cn('absolute top-1.5 right-1.5 z-10', FOLDER_MENU_HOVER)}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground size-7"
                      aria-label={`Folder actions for ${folder.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        props.onClick?.(event);
                      }}
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                    </Button>
                  )}
                />
                <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                    <Pencil className="size-4" aria-hidden />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => void handleDelete()}
                    disabled={busy}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
          <div className="flex h-full min-h-0 flex-1 flex-col p-2.5 pl-3">
            <p
              className={cn(
                'line-clamp-1 pr-8 text-sm leading-snug font-medium',
                dropInvalid ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {folder.name}
            </p>
            <div className="flex min-h-0 flex-1 items-center justify-center py-0.5">
              <Folder
                className={cn(
                  'size-11 shrink-0',
                  dropInvalid ? 'text-muted-foreground/45' : 'text-amber-500/75',
                )}
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <p className="text-muted-foreground truncate text-center text-[10px] leading-none">
              {formatFolderCounts(folder.credentialCount, childFolderCount)}
            </p>
          </div>
        </KanbanCardShell>
      </div>

      <CredentialFolderNameDialog
        open={renameOpen}
        title="Rename folder"
        initialName={folder.name}
        busy={busy}
        onOpenChange={setRenameOpen}
        onSubmit={handleRename}
      />
    </>
  );
}
