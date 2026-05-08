'use client';

import type { ChecklistTemplateItem } from '@/lib/api/checklist-templates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ChecklistTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  loading: boolean;
  items: ChecklistTemplateItem[];
}

export function ChecklistTemplatePreviewDialog({
  open,
  onOpenChange,
  title,
  loading,
  items,
}: ChecklistTemplatePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading version…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No items on this version.</p>
        ) : (
          <ol className="text-muted-foreground max-h-[55vh] list-decimal space-y-2 overflow-auto pl-4 text-sm">
            {items.map((row) => (
              <li key={row.id}>
                <span className="text-foreground font-medium">{row.title}</span>
                {row.instruction ? (
                  <p className="mt-0.5 text-xs leading-snug">{row.instruction}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
