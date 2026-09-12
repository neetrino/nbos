'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/shared';
import { credentialsApi } from '@/lib/api/credentials';
import { toast } from 'sonner';

export interface DeleteCredentialDialogProps {
  credentialId: string | null;
  credentialName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteCredentialDialog({
  credentialId,
  credentialName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCredentialDialogProps) {
  const t = useTranslations('credentials');
  const tCommon = useTranslations('common');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!credentialId) return;
    setDeleting(true);
    try {
      await credentialsApi.delete(credentialId);
      toast.success(t('delete.success'));
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tCommon('genericError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={credentialName ?? ''}
      title={t('delete.title')}
      description={t('delete.description')}
      confirmLabel={t('delete.confirm')}
      isSubmitting={deleting}
      onConfirm={handleDelete}
    />
  );
}
