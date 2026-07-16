'use client';

import { Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared/EntityDetailSheetContent';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

/** Minimal sheet chrome while an entity hydrates by id. */
export function EntityDetailSheetLoadingShell({
  open,
  onOpenChange,
  onOpenChangeComplete: onOpenChangeCompleteProp,
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
  onOpenChangeComplete?: (open: boolean) => void;
  label: string;
  layout?: 'full' | 'auxiliary';
  width?: 'compact' | 'medium' | 'wide';
  contentClassName?: string;
  railAnchorClassName?: string;
  forceNestedBackdrop?: boolean;
  stackAboveEntitySheet?: boolean;
}) {
  const { persistedValue: renderOpen, onOpenChangeComplete: clearRenderOpen } =
    useSheetPersistedValue(open ? true : null);
  const hostMounted = useSheetHostMounted(open, renderOpen);
  if (!hostMounted) return null;

  const handleOpenChangeComplete = (nextOpen: boolean) => {
    clearRenderOpen(nextOpen);
    onOpenChangeCompleteProp?.(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={handleOpenChangeComplete}>
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
