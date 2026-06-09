'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';

export type DeleteConfirmLevel = 'simple' | 'strong';

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: DeleteConfirmLevel;
  itemName: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void | Promise<void>;
  /** Use when the dialog opens inside a sheet or another modal. */
  forceNestedBackdrop?: boolean;
}

const DEFAULT_TITLES: Record<DeleteConfirmLevel, string> = {
  simple: 'Delete this item?',
  strong: 'Confirm permanent delete',
};

const DEFAULT_DESCRIPTIONS: Record<DeleteConfirmLevel, string> = {
  simple: 'This action cannot be undone.',
  strong: 'Type the exact name below. Use Copy, then paste into the field.',
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  level,
  itemName,
  title,
  description,
  confirmLabel = 'Delete',
  isSubmitting = false,
  errorMessage,
  onConfirm,
  forceNestedBackdrop = false,
}: DeleteConfirmDialogProps) {
  const [typedName, setTypedName] = useState('');
  const resolvedTitle = title ?? DEFAULT_TITLES[level];
  const resolvedDescription = description ?? DEFAULT_DESCRIPTIONS[level];

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTypedName('');
    }
    onOpenChange(next);
  };

  const nameOk =
    level === 'simple' || (itemName.trim().length > 0 && typedName.trim() === itemName.trim());

  const handleCopyName = async () => {
    if (!itemName.trim()) return;
    try {
      await navigator.clipboard.writeText(itemName);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>

        {itemName.trim() ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {level === 'strong' ? 'Name to match' : 'Item'}
            </p>
            {level === 'simple' ? (
              <p className="text-foreground truncate text-sm font-medium">{itemName}</p>
            ) : (
              <div className="space-y-2">
                <div className="border-border bg-muted/30 flex items-center gap-2 rounded-lg border px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{itemName}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isSubmitting}
                    onClick={() => void handleCopyName()}
                  >
                    <Copy />
                    Copy
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="delete-confirm-name" className="text-xs">
                    Confirmation
                  </Label>
                  <Input
                    id="delete-confirm-name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Type the name exactly"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-center">
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
