/**
 * Deal detail sheet width — sized for main form + handoff rail (w-72) without excess side space.
 * Keep rail anchor in sync with content width.
 */
export const DEAL_DETAIL_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[min(56rem,calc(100vw-2rem-2.75rem))]';

export const DEAL_DETAIL_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[min(56rem,calc(100vw-2rem-2.75rem))]';
