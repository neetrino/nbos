'use client';

import { useState } from 'react';
import { Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CredentialFolder } from '@/lib/api/credentials';

interface CredentialFolderStripProps {
  folders: CredentialFolder[];
  loading: boolean;
  activeFolderId: string | null;
  showWithoutFolder: boolean;
  canManage: boolean;
  onSelectFolder: (folderId: string | null, withoutFolder?: boolean) => void;
  onCreateFolder: (name: string) => Promise<CredentialFolder>;
  onRenameFolder: (folderId: string, name: string) => Promise<void>;
  onArchiveFolder: (folderId: string) => Promise<void>;
}

function folderButtonClass(active: boolean) {
  return cn(
    'h-8 rounded-lg px-2.5 text-xs',
    active ? 'border-primary/50 bg-primary/10 text-primary' : null,
  );
}

export function CredentialFolderStrip({
  folders,
  loading,
  activeFolderId,
  showWithoutFolder,
  canManage,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onArchiveFolder,
}: CredentialFolderStripProps) {
  const [dialogMode, setDialogMode] = useState<'create' | 'rename' | null>(null);
  const [dialogFolder, setDialogFolder] = useState<CredentialFolder | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setDialogMode('create');
    setDialogFolder(null);
    setName('');
  };

  const openRename = (folder: CredentialFolder) => {
    setDialogMode('rename');
    setDialogFolder(folder);
    setName(folder.name);
  };

  const closeDialog = () => {
    if (busy) return;
    setDialogMode(null);
    setDialogFolder(null);
    setName('');
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Folder name is required');
      return;
    }
    setBusy(true);
    try {
      if (dialogMode === 'rename' && dialogFolder) {
        await onRenameFolder(dialogFolder.id, trimmed);
        toast.success('Folder renamed');
      } else {
        await onCreateFolder(trimmed);
        toast.success('Folder created');
      }
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder could not be saved');
    } finally {
      setBusy(false);
    }
  };

  const archiveSelected = async (folder: CredentialFolder) => {
    setBusy(true);
    try {
      await onArchiveFolder(folder.id);
      toast.success('Folder archived');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Folder could not be archived');
    } finally {
      setBusy(false);
    }
  };

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? null;

  return (
    <>
      <div className="border-border bg-muted/20 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2">
        <Button
          type="button"
          size="sm"
          variant={!activeFolderId && !showWithoutFolder ? 'secondary' : 'outline'}
          className={folderButtonClass(!activeFolderId && !showWithoutFolder)}
          onClick={() => onSelectFolder(null, false)}
        >
          All folders
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showWithoutFolder ? 'secondary' : 'outline'}
          className={folderButtonClass(showWithoutFolder)}
          onClick={() => onSelectFolder(null, true)}
        >
          Without folder
        </Button>
        {folders.map((folder) => {
          const active = activeFolderId === folder.id;
          return (
            <Button
              key={folder.id}
              type="button"
              size="sm"
              variant={active ? 'secondary' : 'outline'}
              className={folderButtonClass(active)}
              onClick={() => onSelectFolder(folder.id, false)}
            >
              <Folder className="size-3.5" aria-hidden />
              <span className="max-w-36 truncate">{folder.name}</span>
              <span className="text-muted-foreground">{folder.credentialCount}</span>
            </Button>
          );
        })}
        {loading ? (
          <span className="text-muted-foreground px-2 text-xs">Loading folders...</span>
        ) : null}
        {canManage ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={openCreate}
          >
            <FolderPlus className="size-3.5" aria-hidden />
            Folder
          </Button>
        ) : null}
        {canManage && activeFolder ? (
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Rename folder"
              onClick={() => openRename(activeFolder)}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Archive folder"
              onClick={() => void archiveSelected(activeFolder)}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'rename' ? 'Rename folder' : 'New folder'}</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Folder name"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
