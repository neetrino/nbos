'use client';

import type { ReactNode } from 'react';
import { SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { EntitySheetFloatingRail } from './entity-sheet-floating-rail';
import {
  DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
  DETAIL_SHEET_CONTENT_WIDTH_AUXILIARY_CLASS,
  DETAIL_SHEET_CONTENT_WIDTH_COMPACT_CLASS,
  DETAIL_SHEET_CONTENT_WIDTH_MEDIUM_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_AUXILIARY_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_COMPACT_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_MEDIUM_CLASS,
} from './detail-sheet-classes';

/**
 * Product layout mode for right sheets.
 * - `full` — entity detail (Deal-scale); default rail: Copy / Open / Workspace.
 * - `auxiliary` — narrow operational panel; default rail: Close only.
 */
export type EntityDetailSheetLayout = 'full' | 'auxiliary';

/** Width preset when `layout="full"` (entity detail density). */
export type EntityDetailSheetWidth = 'wide' | 'medium' | 'compact';

const ENTITY_DETAIL_SHEET_FULL_WIDTH_CONFIG: Record<
  EntityDetailSheetWidth,
  { contentClass: string; anchorClass: string }
> = {
  wide: {
    contentClass: DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
    anchorClass: DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS,
  },
  medium: {
    contentClass: DETAIL_SHEET_CONTENT_WIDTH_MEDIUM_CLASS,
    anchorClass: DETAIL_SHEET_FLOATING_RAIL_ANCHOR_MEDIUM_CLASS,
  },
  compact: {
    contentClass: DETAIL_SHEET_CONTENT_WIDTH_COMPACT_CLASS,
    anchorClass: DETAIL_SHEET_FLOATING_RAIL_ANCHOR_COMPACT_CLASS,
  },
};

const ENTITY_DETAIL_SHEET_AUXILIARY_CONFIG = {
  contentClass: DETAIL_SHEET_CONTENT_WIDTH_AUXILIARY_CLASS,
  anchorClass: DETAIL_SHEET_FLOATING_RAIL_ANCHOR_AUXILIARY_CLASS,
  defaultShowRailActions: false,
} as const;

function resolveShellPreset(
  layout: EntityDetailSheetLayout,
  width: EntityDetailSheetWidth,
): {
  contentClass: string;
  anchorClass: string;
  defaultShowRailActions: boolean;
} {
  if (layout === 'auxiliary') {
    return ENTITY_DETAIL_SHEET_AUXILIARY_CONFIG;
  }
  const preset = ENTITY_DETAIL_SHEET_FULL_WIDTH_CONFIG[width];
  return { ...preset, defaultShowRailActions: true };
}

type SheetContentProps = React.ComponentProps<typeof SheetContent>;

export type EntityDetailSheetContentProps = Omit<
  SheetContentProps,
  | 'side'
  | 'showCloseButton'
  | 'floatingClose'
  | 'floatingRail'
  | 'floatingRailVisible'
  | 'floatingRailAnchorClassName'
> & {
  /** Sync with parent `Sheet` `open` so rail animates with overlay blur. */
  open: boolean;
  /** `full` = entity card; `auxiliary` = narrow helper panel (default Close-only rail). */
  layout?: EntityDetailSheetLayout;
  /** Used when `layout="full"` (default `wide`). Ignored for `auxiliary`. */
  width?: EntityDetailSheetWidth;
  /** Replaces preset content width (e.g. Task sheet, checklist workbench). */
  contentClassName?: string;
  /** Replaces preset rail anchor (must match panel width). */
  railAnchorClassName?: string;
  /** Deep-link target for Open; Copy link uses current URL. */
  sourcePageHref?: string;
  workspaceHref?: string | null;
  /** Module-specific controls below Copy / Open / Dashboard. */
  trailingRail?: ReactNode;
  /**
   * Replaces default {@link EntitySheetFloatingRail} entirely (e.g. workspace drive shortcuts).
   * Close still comes from the shell.
   */
  floatingRailContent?: ReactNode;
  /**
   * When false, only floating Close is shown.
   * Defaults: `true` for `layout="full"`, `false` for `layout="auxiliary"`.
   */
  showRailActions?: boolean;
  children: ReactNode;
};

/**
 * NBOS standard shell for right sheets opened from boards/lists.
 *
 * Prefer `layout="full"` for entity detail (Deal, Lead, Invoice with tabs).
 * Prefer `layout="auxiliary"` for narrow helper panels (bonus ledger) — Close only unless
 * `showRailActions` is set explicitly.
 *
 * Use raw `SheetContent` only for non-sheet flows documented in
 * `docs/reference/patterns/entity-detail-sheet-shell.md`.
 */
export function EntityDetailSheetContent({
  open,
  layout = 'full',
  width = 'wide',
  contentClassName,
  railAnchorClassName,
  sourcePageHref = '#',
  workspaceHref,
  trailingRail,
  floatingRailContent,
  showRailActions,
  className,
  children,
  ...props
}: EntityDetailSheetContentProps) {
  const preset = resolveShellPreset(layout, width);
  const railActionsVisible = showRailActions ?? preset.defaultShowRailActions;
  const defaultRail =
    railActionsVisible && !floatingRailContent ? (
      <EntitySheetFloatingRail
        sourcePageHref={sourcePageHref}
        workspaceHref={workspaceHref}
        trailing={trailingRail}
      />
    ) : undefined;

  return (
    <SheetContent
      side="right"
      showCloseButton={false}
      floatingClose
      floatingRailVisible={open}
      floatingRailAnchorClassName={railAnchorClassName ?? preset.anchorClass}
      floatingRail={floatingRailContent ?? defaultRail}
      className={cn(contentClassName ?? preset.contentClass, className)}
      {...props}
    >
      {children}
    </SheetContent>
  );
}
