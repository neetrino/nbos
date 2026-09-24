/**
 * Mail active panel (compose, thread, connect, share) docks from the right.
 * Width is capped so ultrawide monitors stay a reading column; 13" laptops
 * still fill most of the content area beside the app sidebar.
 *
 * Requires `--app-sidebar-width` on `:root` (set by {@link AppLayout}).
 */

import { cn } from '@/lib/utils';
import {
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
  SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS,
  SHEET_VIEWPORT_MAX_HEIGHT_CLASS,
  SHEET_VIEWPORT_TOP_INSET_CLASS,
} from '@/components/shared/detail-sheet-classes';

/**
 * Desktop mail panel width: 64rem (~1024px) or remaining space beside the
 * sidebar — whichever is smaller. Keep as a complete Tailwind token.
 */
const MAIL_WORKSPACE_DESKTOP_WIDTH_CLASS =
  'sm:data-[side=right]:w-[min(64rem,calc(100vw-var(--app-sidebar-width)-2.75rem))]';

const MAIL_WORKSPACE_DESKTOP_RAIL_CLASS =
  'sm:right-[min(64rem,calc(100vw-var(--app-sidebar-width)-2.75rem))]';

const MAIL_NESTED_FORWARD_DESKTOP_WIDTH_CLASS =
  'sm:data-[side=right]:w-[min(52rem,calc(100vw-var(--app-sidebar-width)-2.75rem-4rem))]';

const MAIL_NESTED_FORWARD_DESKTOP_RAIL_CLASS =
  'sm:right-[min(52rem,calc(100vw-var(--app-sidebar-width)-2.75rem-4rem))]';

const MAIL_ACCESS_DESKTOP_WIDTH_CLASS =
  'sm:data-[side=right]:w-[min(36rem,calc(100vw-var(--app-sidebar-width)-2.75rem))]';

const MAIL_ACCESS_DESKTOP_RAIL_CLASS =
  'sm:right-[min(36rem,calc(100vw-var(--app-sidebar-width)-2.75rem))]';

/** Maps shared viewport inset tokens to right-sheet side selectors for SheetContent merge. */
function rightSheetSideClasses(...utilityClasses: string[]): string {
  return utilityClasses
    .flatMap((token) => token.split(/\s+/))
    .filter(Boolean)
    .map((token) => `data-[side=right]:${token}`)
    .join(' ');
}

/** Right sheet panel: 85vw on mobile; capped reading column on `sm+`. */
export const MAIL_WORKSPACE_SHEET_CONTENT_CLASS = cn(
  'flex w-full flex-col gap-0 overflow-hidden p-0',
  rightSheetSideClasses(
    SHEET_VIEWPORT_TOP_INSET_CLASS,
    'bottom-0',
    SHEET_VIEWPORT_MAX_HEIGHT_CLASS,
  ),
  'data-[side=right]:rounded-tl-2xl data-[side=right]:border-l',
  'data-[side=right]:w-[85vw] data-[side=right]:max-w-none',
  'sm:data-[side=right]:left-auto sm:data-[side=right]:right-0',
  MAIL_WORKSPACE_DESKTOP_WIDTH_CLASS,
  'sm:max-w-none',
);

/** Floating close rail: anchor to the left edge of the mail workspace panel. */
export const MAIL_WORKSPACE_SHEET_RAIL_ANCHOR_CLASS = cn(
  SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS,
  MAIL_WORKSPACE_DESKTOP_RAIL_CLASS,
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
);

/** Narrow form panel (Share / Connect / Reconnect) — not a reading column. */
export const MAIL_ACCESS_SHEET_CONTENT_CLASS = cn(
  'flex w-full flex-col gap-0 overflow-hidden p-0',
  rightSheetSideClasses(
    SHEET_VIEWPORT_TOP_INSET_CLASS,
    'bottom-0',
    SHEET_VIEWPORT_MAX_HEIGHT_CLASS,
  ),
  'data-[side=right]:rounded-tl-2xl data-[side=right]:border-l',
  'data-[side=right]:w-[85vw] data-[side=right]:max-w-none',
  'sm:data-[side=right]:left-auto sm:data-[side=right]:right-0',
  MAIL_ACCESS_DESKTOP_WIDTH_CLASS,
  'sm:max-w-none',
);

export const MAIL_ACCESS_SHEET_RAIL_ANCHOR_CLASS = cn(
  SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS,
  MAIL_ACCESS_DESKTOP_RAIL_CLASS,
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
);

/**
 * Nested forward composer panel: keep parent thread visibly exposed on `sm+`.
 * Mobile uses 85vw like other entity sheets.
 */
export const MAIL_NESTED_FORWARD_SHEET_CONTENT_CLASS = cn(
  'flex w-full flex-col gap-0 overflow-hidden p-0',
  rightSheetSideClasses(
    SHEET_VIEWPORT_TOP_INSET_CLASS,
    'bottom-0',
    SHEET_VIEWPORT_MAX_HEIGHT_CLASS,
  ),
  'data-[side=right]:rounded-tl-2xl data-[side=right]:border-l',
  'data-[side=right]:w-[85vw] data-[side=right]:max-w-none',
  'sm:data-[side=right]:left-auto sm:data-[side=right]:right-0',
  MAIL_NESTED_FORWARD_DESKTOP_WIDTH_CLASS,
  'sm:max-w-none',
);

/** Floating close rail anchor for nested forward composer width preset. */
export const MAIL_NESTED_FORWARD_SHEET_RAIL_ANCHOR_CLASS = cn(
  SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS,
  MAIL_NESTED_FORWARD_DESKTOP_RAIL_CLASS,
  SHEET_FLOATING_RAIL_TOP_INSET_CLASS,
);
