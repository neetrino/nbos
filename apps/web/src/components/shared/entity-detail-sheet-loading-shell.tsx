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
  contentClassName,
  railAnchorClassName,
  forceNestedBackdrop = false,
  stackAboveEntitySheet = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  layout?: 'full' | 'auxiliary';
  width?: 'compact' | 'medium' | 'wide';
  contentClassName?: string;
  railAnchorClassName?: string;
  forceNestedBackdrop?: boolean;
  stackAboveEntitySheet?: boolean;
}) {
  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout={layout}
        width={width}
        contentClassName={contentClassName}
        railAnchorClassName={railAnchorClassName}
        forceNestedBackdrop={forceNestedBackdrop}
        stackAboveEntitySheet={stackAboveEntitySheet}
      >
        <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {label}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
