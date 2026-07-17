/**
 * Contact / company portfolio sheet — same `vw` pattern as Partner sheets.
 */
export const CONTACT_SHEET_CONTENT_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[70vw]';

export const CONTACT_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[70vw]';

/**
 * Single-row tab strip (like Employee / default DetailSheetTabBar).
 * Do not use flex-wrap — portfolio accessMask changes tab count and wrapping
 * shifts body content upward after open.
 */
export const CONTACT_SHEET_TAB_BAR_SCROLL_CLASS =
  'flex flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const CONTACT_SHEET_BODY_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain';
