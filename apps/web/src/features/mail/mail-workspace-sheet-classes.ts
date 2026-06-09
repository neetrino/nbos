/**
 * Mail active panel (compose, thread, connect, share) fills the viewport area
 * to the right of the global NBOS app sidebar, with standard entity-detail top inset.
 *
 * Requires `--app-sidebar-width` on `:root` (set by {@link AppLayout}).
 */

import { cn } from '@/lib/utils';
import {
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
  SHEET_VIEWPORT_MAX_HEIGHT_CLASS,
  SHEET_VIEWPORT_TOP_INSET_CLASS,
} from '@/components/shared/detail-sheet-classes';

/** Maps shared viewport inset tokens to right-sheet side selectors for SheetContent merge. */
function rightSheetSideClasses(...utilityClasses: string[]): string {
  return utilityClasses
    .flatMap((token) => token.split(/\s+/))
    .filter(Boolean)
    .map((token) => `data-[side=right]:${token}`)
    .join(' ');
}

/** Right sheet panel: full width right of app sidebar on `sm+`, full viewport on mobile. */
export const MAIL_WORKSPACE_SHEET_CONTENT_CLASS = cn(
  'flex w-full flex-col gap-0 overflow-hidden p-0',
  rightSheetSideClasses(
    SHEET_VIEWPORT_TOP_INSET_CLASS,
    'bottom-0',
    SHEET_VIEWPORT_MAX_HEIGHT_CLASS,
  ),
  'data-[side=right]:rounded-tl-2xl data-[side=right]:border-l',
  'data-[side=right]:w-full data-[side=right]:max-w-none',
  'sm:data-[side=right]:left-[var(--app-sidebar-width)] sm:data-[side=right]:right-0',
  'sm:data-[side=right]:w-auto sm:max-w-none',
);

/** Floating close rail: anchor to the left edge of the mail workspace panel. */
export const MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS = cn(
  'max-sm:left-3 sm:right-[calc(100vw-var(--app-sidebar-width))]',
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
);
