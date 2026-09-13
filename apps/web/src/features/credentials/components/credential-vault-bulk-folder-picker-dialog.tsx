'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CredentialFolderTreePicker } from '@/features/credentials/components/credential-folder-tree-picker';
import type { CredentialFolder } from '@/lib/api/credentials';

export interface CredentialVaultBulkFolderPickerDialogProps {
  open: boolean;
  folders: CredentialFolder[];
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderId: string) => void;
}

export function CredentialVaultBulkFolderPickerDialog({
  open,
  folders,
  busy,
  onOpenChange,
  onConfirm,
}: CredentialVaultBulkFolderPickerDialogProps) {
  const t = useTranslations('credentials');
  const tCommon = useTranslations('common');
  const [folderId, setFolderId] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setFolderId(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('bulk.pickerTitle')}</DialogTitle>
          <DialogDescription>{t('bulk.pickerDescription')}</DialogDescription>
        </DialogHeader>
        <CredentialFolderTreePicker folders={folders} value={folderId} onChange={setFolderId} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            disabled={busy || !folderId}
            onClick={() => folderId && onConfirm(folderId)}
          >
            {t('bulk.pickerMove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
