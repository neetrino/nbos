/** Compact plus glyph inside entity sheet tab pills. */
export const TAB_QUICK_CREATE_ICON_SIZE_PX = 14;

/**
 * Reserved slot width keeps tab pills from shifting when the plus appears on hover.
 * Touch / coarse pointer: plus stays visible via {@link TAB_QUICK_CREATE_SLOT_CLASS}.
 */
export const TAB_QUICK_CREATE_SLOT_CLASS =
  'ml-1.5 flex size-6 shrink-0 items-center justify-center';

/**
 * Hover-reveal on pointer devices; always visible on coarse pointer (no hover).
 * Parent tab pill must use `group/tab`.
 */
export const TAB_QUICK_CREATE_BUTTON_CLASS =
  'text-muted-foreground hover:text-foreground focus-visible:text-foreground pointer-events-none flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100 disabled:pointer-events-none disabled:opacity-0';
