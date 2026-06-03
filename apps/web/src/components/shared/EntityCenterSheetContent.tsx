'use client';

import type { ReactNode } from 'react';
import { SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { EntitySheetFloatingRail } from './entity-sheet-floating-rail';
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
  | 'side'
  | 'showCloseButton'
  | 'floatingClose'
  | 'floatingRail'
  | 'floatingRailVisible'
  | 'floatingRailAnchorClassName'
> & {
  open: boolean;
  width?: EntityCenterSheetWidth;
  contentClassName?: string;
  sourcePageHref?: string;
  workspaceHref?: string | null;
  trailingRail?: ReactNode;
  floatingRailContent?: ReactNode;
  showRailActions?: boolean;
  /** When false: no floating X rail — dismiss via backdrop / Esc (credentials vault). */
  floatingClose?: boolean;
  /** In-panel close control (only when `floatingClose` is false). */
  showCloseButton?: boolean;
  children: ReactNode;
};

/**
 * Bottom-center sheet (90vh). Rail is a flex sibling of the panel — always left of the sheet.
 */
export function EntityCenterSheetContent({
  open,
  width = 'medium',
  contentClassName,
  sourcePageHref = '#',
  workspaceHref,
  trailingRail,
  floatingRailContent,
  showRailActions = true,
  floatingClose = true,
  showCloseButton = false,
  className,
  children,
  ...props
}: EntityCenterSheetContentProps) {
  const defaultRail =
    floatingClose && showRailActions && !floatingRailContent ? (
      <EntitySheetFloatingRail
        sourcePageHref={sourcePageHref}
        workspaceHref={workspaceHref}
        trailing={trailingRail}
      />
    ) : undefined;

  return (
    <SheetContent
      side="center"
      showCloseButton={showCloseButton}
      floatingClose={floatingClose}
      floatingRailVisible={open}
      floatingRail={floatingRailContent ?? defaultRail}
      className={cn('gap-0 p-0', resolveCenterWidthClass(width), contentClassName, className)}
      {...props}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">{children}</div>
    </SheetContent>
  );
}
