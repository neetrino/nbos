'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog, type DeleteConfirmDialogProps } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface EnvTablePasteChoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
  existingCount: number;
  incomingCount: number;
  onMerge: () => void;
  onReplace: () => void;
}

export function EnvTablePasteChoiceDialog({
  isOpen,
  onOpenChange,
  existingCount,
  incomingCount,
  onMerge,
  onReplace,
}: EnvTablePasteChoiceDialogProps) {
  const t = useTranslations('credentials');
  const tCommon = useTranslations('common');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('env.pasteTitle')}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          {t('env.pasteBody', { existing: existingCount, incoming: incomingCount })}
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" variant="outline" onClick={onMerge}>
            {t('env.merge')}
          </Button>
          <Button type="button" onClick={onReplace}>
            {t('env.replaceAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EnvTableConfirmDialog({
  dialogProps,
}: {
  dialogProps: DeleteConfirmDialogProps | null;
}) {
  if (!dialogProps) return null;
  return <DeleteConfirmDialog {...dialogProps} />;
}
