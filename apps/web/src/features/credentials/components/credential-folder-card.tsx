'use client';

import { useState } from 'react';
import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DriveTileShell } from '@/features/drive/DriveTileShell';
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

const FOLDER_MENU_HOVER =
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

interface CredentialFolderCardProps {
  folder: CredentialFolder;
  childFolderCount: number;
  canManage: boolean;
  onOpen: (folderId: string) => void;
  onRename: (folderId: string, name: string) => Promise<void>;
  onArchive: (folderId: string) => Promise<void>;
}

function formatFolderSubtitle(credentialCount: number, childFolderCount: number): string {
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
  onArchive,
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

  const handleArchive = async () => {
    setBusy(true);
    try {
      await onArchive(folder.id);
      toast.success('Folder archived');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder could not be archived');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="group relative">
        <DriveTileShell
          title={folder.name}
          subtitle={formatFolderSubtitle(folder.credentialCount, childFolderCount)}
          icon={<Folder className="size-5" strokeWidth={2} aria-hidden />}
          onClick={() => onOpen(folder.id)}
        />
        {canManage ? (
          <div className={cn('absolute top-2 right-2 z-10', FOLDER_MENU_HOVER)}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="bg-background/80 size-7"
                  aria-label={`Folder actions for ${folder.name}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="size-4" aria-hidden />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => void handleArchive()}
                  disabled={busy}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
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
