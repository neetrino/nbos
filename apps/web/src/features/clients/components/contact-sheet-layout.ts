/**
 * Contact / company portfolio sheet — rem-capped (not vw-growing) so large
 * monitors stay compact while all portfolio tabs still fit on one row.
 */
export const CONTACT_SHEET_CONTENT_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[min(58rem,calc(100vw-2.5rem))]';

export const CONTACT_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[min(58rem,calc(100vw-2.5rem))]';

/**
 * Full tab strip on one row. No horizontal scroll on `sm+` so Files stays visible;
 * narrow phones may still scroll.
 */
export const CONTACT_SHEET_TAB_BAR_SCROLL_CLASS =
  'flex w-full min-w-0 flex-nowrap items-center justify-start gap-1 max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden sm:overflow-visible';

export const CONTACT_SHEET_BODY_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain';
