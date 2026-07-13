/**
 * Contact / company portfolio sheet width.
 * Wide enough for General → Files tabs (incl. Support / Communication / Files) without horizontal scroll.
 */
export const CONTACT_SHEET_CONTENT_WIDTH_CLASS =
  'flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[56rem]';

export const CONTACT_SHEET_RAIL_ANCHOR_CLASS = 'sm:right-[56rem]';

/** Scroll still works; scrollbar chrome hidden (tabs + tab body). */
export const CONTACT_SHEET_HIDDEN_SCROLLBAR_CLASS =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const CONTACT_SHEET_BODY_SCROLL_CLASS = `min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${CONTACT_SHEET_HIDDEN_SCROLLBAR_CLASS}`;
