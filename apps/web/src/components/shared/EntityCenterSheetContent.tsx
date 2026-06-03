'use client';

import type { ReactNode } from 'react';
import { SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  CENTER_SHEET_WIDTH_AUXILIARY_CLASS,
  CENTER_SHEET_WIDTH_COMPACT_CLASS,
  CENTER_SHEET_WIDTH_MEDIUM_CLASS,
} from './detail-sheet-classes';
import type { EntityDetailSheetWidth } from './EntityDetailSheetContent';

/** Width preset for centered rise sheets (compact forms, credentials). */
export type EntityCenterSheetWidth = EntityDetailSheetWidth | 'auxiliary';

const CENTER_SHEET_WIDTH_CONFIG: Record<EntityDetailSheetWidth, string> = {
  wide: CENTER_SHEET_WIDTH_MEDIUM_CLASS,
  medium: CENTER_SHEET_WIDTH_MEDIUM_CLASS,
  compact: CENTER_SHEET_WIDTH_COMPACT_CLASS,
};

function resolveCenterWidthClass(width: EntityCenterSheetWidth): string {
  if (width === 'auxiliary') {
    return CENTER_SHEET_WIDTH_AUXILIARY_CLASS;
  }
  return CENTER_SHEET_WIDTH_CONFIG[width];
}

type SheetContentProps = React.ComponentProps<typeof SheetContent>;

export type EntityCenterSheetContentProps = Omit<
  SheetContentProps,
  'side' | 'floatingClose' | 'floatingRail' | 'floatingRailVisible' | 'floatingRailAnchorClassName'
> & {
  /** Default `medium` — matches compact entity forms (credentials, quick settings). */
  width?: EntityCenterSheetWidth;
  /** Replaces preset content width. */
  contentClassName?: string;
  children: ReactNode;
};

/**
 * Centered sheet that rises from the bottom (max 95vh).
 * Use for compact entity forms — not full Deal/Lead detail cards.
 *
 * Prefer {@link EntityDetailSheetContent} for wide right-side entity detail.
 */
export function EntityCenterSheetContent({
  width = 'medium',
  contentClassName,
  className,
  children,
  showCloseButton = true,
  ...props
}: EntityCenterSheetContentProps) {
  return (
    <SheetContent
      side="center"
      showCloseButton={showCloseButton}
      floatingClose={false}
      className={cn(
        'gap-0 overflow-hidden',
        resolveCenterWidthClass(width),
        contentClassName,
        className,
      )}
      {...props}
    >
      {children}
    </SheetContent>
  );
}
