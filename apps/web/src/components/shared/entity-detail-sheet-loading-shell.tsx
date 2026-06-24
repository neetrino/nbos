'use client';

import { Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared/EntityDetailSheetContent';

/** Minimal sheet chrome while an entity hydrates by id. */
export function EntityDetailSheetLoadingShell({
  open,
  onOpenChange,
  label,
  layout = 'full',
  width,
  forceNestedBackdrop = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  layout?: 'full' | 'auxiliary';
  width?: 'compact' | 'medium' | 'wide';
  forceNestedBackdrop?: boolean;
}) {
  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout={layout}
        width={width}
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {label}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
