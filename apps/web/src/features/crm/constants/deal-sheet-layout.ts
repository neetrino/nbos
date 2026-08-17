/**
 * Deal detail sheet width — main form + handoff rail (w-64); sheet keeps room for a wider left column.
 * Keep rail anchor in sync with content width.
 */
export const DEAL_DETAIL_SHEET_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-[85vw] sm:max-w-none sm:data-[side=right]:w-[min(56rem,calc(100vw-2rem-2.75rem))]';

export const DEAL_DETAIL_SHEET_RAIL_ANCHOR_CLASS =
  'max-sm:left-auto max-sm:right-[85vw] max-sm:translate-x-px sm:right-[min(56rem,calc(100vw-2rem-2.75rem))]';
