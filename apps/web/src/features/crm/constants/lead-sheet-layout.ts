/**
 * Lead detail sheet — viewport-capped width so the floating rail + panel stay fully visible.
 * Keep rail anchor in sync with content width.
 */
import { SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS } from '@/components/shared/detail-sheet-classes';

export const LEAD_DETAIL_SHEET_WIDTH_CLASS =
  'flex w-full min-w-0 max-w-[100vw] flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[min(48rem,calc(100vw-2rem-2.75rem))]';

export const LEAD_DETAIL_SHEET_RAIL_ANCHOR_CLASS = `${SHEET_MOBILE_FLOATING_RAIL_ANCHOR_CLASS} sm:right-[min(48rem,calc(100vw-2rem-2.75rem))]`;
