/** Compact plus glyph inside the circular overlay control. */
export const TAB_QUICK_CREATE_ICON_SIZE_PX = 14;

/**
 * Anchors the circle on the tab’s right edge without growing the pill
 * (absolute; parent wrapper is `relative`).
 */
export const TAB_QUICK_CREATE_ANCHOR_CLASS =
  'absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-1/2';

/**
 * Bitrix-style circular plus: bordered, soft fill, hover-reveal.
 * Parent must use `group/tab`.
 */
export const TAB_QUICK_CREATE_BUTTON_CLASS =
  'border-border/70 bg-background/85 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground pointer-events-none flex size-6 items-center justify-center rounded-full border shadow-sm opacity-0 backdrop-blur-sm transition-opacity group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100 disabled:pointer-events-none disabled:opacity-0';
