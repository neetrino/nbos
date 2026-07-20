/** Right sheet width for Partner detail. */
export const PARTNER_SHEET_CONTENT_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[58vw]';

export const PARTNER_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[58vw]';

/**
 * Single-row tab strip (no wrap). Start-aligned like other entity sheets so zoom/wide
 * viewports do not shove the strip to the trailing edge.
 */
export const PARTNER_SHEET_TAB_BAR_SCROLL_CLASS =
  'flex w-full min-w-0 flex-nowrap items-center justify-start gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
