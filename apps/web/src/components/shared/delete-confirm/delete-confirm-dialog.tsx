'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type DeleteConfirmLevel = 'simple' | 'strong';

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: DeleteConfirmLevel;
  itemName: string;
  title?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void | Promise<void>;
}

const DEFAULT_TITLES: Record<DeleteConfirmLevel, string> = {
  simple: 'Delete?',
  strong: 'Confirm delete',
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  level,
  itemName,
  title,
  confirmLabel = 'Delete',
  isSubmitting = false,
  errorMessage,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [typedName, setTypedName] = useState('');
  const resolvedTitle = title ?? DEFAULT_TITLES[level];

  useEffect(() => {
    if (!open) setTypedName('');
  }, [open]);

  const nameOk =
    level === 'simple' || (itemName.trim().length > 0 && typedName.trim() === itemName.trim());

  const handleCopyName = async () => {
    if (!itemName.trim()) return;
    try {
      await navigator.clipboard.writeText(itemName);
      setTypedName(itemName);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription className={cn(level === 'strong' && 'sr-only')}>
            {itemName || 'This item'}
          </DialogDescription>
        </DialogHeader>

        {level === 'simple' ? (
          itemName ? (
            <p className="text-foreground truncate text-sm font-medium">{itemName}</p>
          ) : null
        ) : (
          <div className="space-y-2">
            <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{itemName}</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={!itemName.trim() || isSubmitting}
                onClick={() => void handleCopyName()}
              >
                <Copy />
                Copy
              </Button>
            </div>
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={itemName || 'Name'}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>
        )}

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting || !nameOk}
            onClick={() => void onConfirm()}
          >
            {isSubmitting ? 'Deleting…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
